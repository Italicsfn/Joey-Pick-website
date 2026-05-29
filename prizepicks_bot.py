import os
import discord
from discord.ext import commands
import aiohttp
import asyncio
from datetime import datetime

# ============================================
DISCORD_TOKEN = os.environ.get("DISCORD_TOKEN", "")
ODDS_API_KEY = os.environ.get("ODDS_API_KEY", "")
# ============================================

SPORT_MAP = {
    "nba": "basketball_nba",
    "nfl": "americanfootball_nfl",
    "mlb": "baseball_mlb",
    "nhl": "icehockey_nhl",
}

PP_LEAGUE_MAP = {
    "nba": "NBA",
    "nfl": "NFL",
    "mlb": "MLB",
    "nhl": "NHL",
}

PROP_MARKET_MAP = {
    "nba": ["player_points", "player_rebounds", "player_assists"],
    "nfl": ["player_pass_yds", "player_rush_yds", "player_reception_yds", "player_pass_tds"],
    "mlb": ["batter_hits", "pitcher_strikeouts"],
    "nhl": ["player_goals", "player_assists"],
}

intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix="!", intents=intents)


async def fetch_prizepicks(league=None):
    """Fetch PrizePicks projections"""
    url = "https://partner-api.prizepicks.com/projections?per_page=1000"
    if league:
        url += f"&league_id={league}"
    
    headers = {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json"
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as resp:
            if resp.status == 200:
                return await resp.json()
            return None


async def fetch_odds_props(sport):
    """Fetch sportsbook prop odds"""
    markets = PROP_MARKET_MAP.get(sport, [])
    if not markets:
        return []

    url = f"https://api.the-odds-api.com/v4/sports/{SPORT_MAP[sport]}/odds"
    params = {
        "apiKey": ODDS_API_KEY,
        "regions": "us",
        "markets": ",".join(markets),
        "oddsFormat": "american",
    }

    async with aiohttp.ClientSession() as session:
        async with session.get(url, params=params) as resp:
            if resp.status == 200:
                return await resp.json()
            return []


def american_to_prob(odds):
    if odds < 0:
        return (-odds) / (-odds + 100) * 100
    return 100 / (odds + 100) * 100


def parse_prizepicks(data, league_filter=None):
    """Parse PrizePicks projections into usable format"""
    props = []
    if not data or "data" not in data:
        return props

    # Build player lookup from included
    players = {}
    included = data.get("included", [])
    for item in included:
        if item.get("type") == "new_player":
            pid = item["id"]
            attrs = item.get("attributes", {})
            players[pid] = {
                "name": attrs.get("display_name", "Unknown"),
                "team": attrs.get("team", ""),
                "league": attrs.get("league", ""),
            }

    for proj in data["data"]:
        attrs = proj.get("attributes", {})
        league = attrs.get("league", "")

        if league_filter and league.upper() != league_filter.upper():
            continue

        player_id = proj.get("relationships", {}).get("new_player", {}).get("data", {}).get("id")
        player = players.get(player_id, {})

        stat_type = attrs.get("stat_type", "")
        line = attrs.get("line_score", 0)

        props.append({
            "player": player.get("name", "Unknown"),
            "team": player.get("team", ""),
            "league": league,
            "stat": stat_type,
            "line": float(line),
        })

    return props


def find_edges(pp_props, odds_games, sport):
    """Compare PrizePicks lines vs sportsbook lines and find edges"""
    edges = []

    stat_map = {
        "Points": "player_points",
        "Rebounds": "player_rebounds",
        "Assists": "player_assists",
        "Passing Yards": "player_pass_yds",
        "Rushing Yards": "player_rush_yds",
        "Receiving Yards": "player_reception_yds",
        "Strikeouts": "pitcher_strikeouts",
        "Hits": "batter_hits",
        "Goals": "player_goals",
        "Assists + Goals": "player_assists",
    }

    # Build sportsbook lookup
    sb_lookup = {}
    for game in odds_games:
        for bookmaker in game.get("bookmakers", [])[:2]:
            for market in bookmaker.get("markets", []):
                market_key = market["key"]
                for outcome in market.get("outcomes", []):
                    player_name = outcome.get("description", outcome.get("name", ""))
                    point = outcome.get("point", 0)
                    price = outcome["price"]
                    side = outcome["name"]
                    key = f"{player_name.lower()}_{market_key}"
                    if key not in sb_lookup:
                        sb_lookup[key] = []
                    sb_lookup[key].append({
                        "point": point,
                        "price": price,
                        "side": side
                    })

    for pp in pp_props:
        player = pp["player"]
        stat = pp["stat"]
        pp_line = pp["line"]
        market_key = stat_map.get(stat)

        if not market_key:
            continue

        sb_key = f"{player.lower()}_{market_key}"
        sb_outcomes = sb_lookup.get(sb_key, [])

        if not sb_outcomes:
            continue

        # Find the over outcome from sportsbooks
        over_outcomes = [o for o in sb_outcomes if o["side"].lower() == "over"]
        under_outcomes = [o for o in sb_outcomes if o["side"].lower() == "under"]

        if not over_outcomes:
            continue

        # Get best over line from sportsbooks
        best_over = min(over_outcomes, key=lambda x: x["point"])
        sb_line = best_over["point"]
        sb_price = best_over["price"]
        sb_prob = american_to_prob(sb_price)

        # Find edge
        line_diff = pp_line - sb_line

        if line_diff > 0.5:
            # PP line is HIGHER than sportsbook = take UNDER on PP
            edge_type = "UNDER"
            edge_desc = f"PP line ({pp_line}) is HIGHER than books ({sb_line}) → Take UNDER"
            edge_score = line_diff
        elif line_diff < -0.5:
            # PP line is LOWER than sportsbook = take OVER on PP
            edge_type = "OVER"
            edge_desc = f"PP line ({pp_line}) is LOWER than books ({sb_line}) → Take OVER"
            edge_score = abs(line_diff)
        else:
            continue

        edges.append({
            "player": player,
            "team": pp["team"],
            "stat": stat,
            "pp_line": pp_line,
            "sb_line": sb_line,
            "sb_prob": round(sb_prob, 1),
            "edge_type": edge_type,
            "edge_desc": edge_desc,
            "edge_score": edge_score,
            "sb_price": sb_price,
        })

    # Sort by biggest edge
    edges.sort(key=lambda x: x["edge_score"], reverse=True)
    return edges[:10]


@bot.event
async def on_ready():
    print(f"✅ {bot.user} is online and ready!")


@bot.command(name="pp")
async def prizepicks_lines(ctx, *, league: str = "NBA"):
    """Show current PrizePicks lines: !pp NBA"""
    league = league.upper()
    msg = await ctx.send(f"🔍 Fetching PrizePicks lines for **{league}**...")

    data = await fetch_prizepicks()
    if not data:
        await msg.edit(content="❌ Could not fetch PrizePicks data. Try again!")
        return

    props = parse_prizepicks(data, league)

    if not props:
        await msg.edit(content=f"❌ No props found for **{league}** right now.")
        return

    embed = discord.Embed(
        title=f"🎯 PrizePicks — {league} Lines",
        color=discord.Color.purple(),
        timestamp=datetime.utcnow()
    )
    embed.set_footer(text="PrizePicks current projections")

    # Group by stat
    stat_groups = {}
    for prop in props[:30]:
        stat = prop["stat"]
        if stat not in stat_groups:
            stat_groups[stat] = []
        stat_groups[stat].append(prop)

    for stat, stat_props in list(stat_groups.items())[:5]:
        lines = []
        for p in stat_props[:6]:
            lines.append(f"**{p['player']}** ({p['team']}) — {p['line']}")
        embed.add_field(
            name=f"📊 {stat}",
            value="\n".join(lines),
            inline=False
        )

    await msg.edit(content=None, embed=embed)


@bot.command(name="pplookup")
async def prizepicks_player(ctx, *, player_name: str):
    """Look up a specific player on PrizePicks: !pplookup LeBron James"""
    msg = await ctx.send(f"🔍 Looking up **{player_name}** on PrizePicks...")

    data = await fetch_prizepicks()
    if not data:
        await msg.edit(content="❌ Could not fetch PrizePicks data.")
        return

    all_props = parse_prizepicks(data)
    player_props = [p for p in all_props if player_name.lower() in p["player"].lower()]

    if not player_props:
        await msg.edit(content=f"❌ **{player_name}** not found on PrizePicks right now.")
        return

    embed = discord.Embed(
        title=f"🎯 {player_props[0]['player']} — PrizePicks Lines",
        color=discord.Color.purple(),
        description=f"Team: {player_props[0]['team']} | League: {player_props[0]['league']}"
    )

    lines = []
    for prop in player_props:
        lines.append(f"**{prop['stat']}**: {prop['line']}")

    embed.add_field(name="📊 Current Lines", value="\n".join(lines), inline=False)
    embed.set_footer(text="PrizePicks current projections")

    await msg.edit(content=None, embed=embed)


@bot.command(name="edge")
async def find_edge(ctx, *, sport: str = "NBA"):
    """Find edges between PrizePicks and sportsbooks: !edge NBA"""
    sport = sport.lower()
    if sport not in SPORT_MAP:
        await ctx.send(f"❌ Sport not supported. Use: {', '.join(SPORT_MAP.keys()).upper()}")
        return

    msg = await ctx.send(f"🔍 Analyzing edges for **{sport.upper()}**... this may take a moment!")

    pp_data = await fetch_prizepicks()
    odds_data = await fetch_odds_props(sport)

    if not pp_data:
        await msg.edit(content="❌ Could not fetch PrizePicks data.")
        return

    league = PP_LEAGUE_MAP[sport]
    pp_props = parse_prizepicks(pp_data, league)
    edges = find_edges(pp_props, odds_data, sport)

    if not edges:
        await msg.edit(content=f"❌ No edges found for **{sport.upper()}** right now. Lines may match or no games today.")
        return

    embed = discord.Embed(
        title=f"🔥 {sport.upper()} Edges — PrizePicks vs Sportsbooks",
        color=discord.Color.green(),
        timestamp=datetime.utcnow(),
        description="Lines where PrizePicks differs from sportsbooks"
    )
    embed.set_footer(text="⚠️ For entertainment only. Gamble responsibly.")

    for edge in edges[:8]:
        price_str = f"+{edge['sb_price']}" if edge['sb_price'] > 0 else str(edge['sb_price'])
        embed.add_field(
            name=f"{'✅' if edge['edge_type'] == 'OVER' else '🔻'} {edge['player']} — {edge['stat']} {edge['edge_type']}",
            value=(
                f"PrizePicks: **{edge['pp_line']}**\n"
                f"Sportsbooks: **{edge['sb_line']}** ({price_str}) — {edge['sb_prob']}%\n"
                f"📊 {edge['edge_desc']}"
            ),
            inline=False
        )

    await msg.edit(content=None, embed=embed)


@bot.command(name="pphelp")
async def pp_help(ctx):
    embed = discord.Embed(
        title="🎯 PrizePicks Helper Commands",
        color=discord.Color.purple()
    )
    embed.add_field(name="!pp NBA", value="Show all current PrizePicks NBA lines", inline=False)
    embed.add_field(name="!pplookup PlayerName", value="Look up a specific player's lines\nExample: `!pplookup LeBron James`", inline=False)
    embed.add_field(name="!edge NBA", value="Find edges between PrizePicks and sportsbooks\nWorks with: NBA, NFL, MLB, NHL", inline=False)
    await ctx.send(embed=embed)


bot.run(DISCORD_TOKEN)
