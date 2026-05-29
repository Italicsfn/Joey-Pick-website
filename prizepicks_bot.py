import os
import discord
from discord.ext import commands
import aiohttp
from datetime import datetime

# ============================================
DISCORD_TOKEN = os.environ.get("DISCORD_TOKEN", "")
ODDS_API_KEY = os.environ.get("ODDS_API_KEY", "")
# ============================================

# PrizePicks league IDs
LEAGUE_IDS = {
    "nba": 7,
    "nfl": 9,
    "mlb": 2,
    "nhl": 8,
    "nba2": 3,  # backup
}

SPORT_MAP = {
    "nba": "basketball_nba",
    "nfl": "americanfootball_nfl",
    "mlb": "baseball_mlb",
    "nhl": "icehockey_nhl",
}

PROP_MARKET_MAP = {
    "nba": ["player_points", "player_rebounds", "player_assists"],
    "nfl": ["player_pass_yds", "player_rush_yds", "player_reception_yds"],
    "mlb": ["batter_hits", "pitcher_strikeouts", "batter_total_bases", "pitcher_outs", "batter_home_runs", "batter_rbis"],
    "nhl": ["player_goals", "player_assists"],
}

intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix="!", intents=intents)


async def fetch_prizepicks(league_id=None):
    if league_id:
        url = f"https://api.prizepicks.com/projections?league_id={league_id}&per_page=250&single_stat=true"
    else:
        url = "https://api.prizepicks.com/projections?per_page=500&single_stat=true"

    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "application/json",
        "Referer": "https://prizepicks.com/",
        "Origin": "https://prizepicks.com",
    }

    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as resp:
            if resp.status == 200:
                return await resp.json()
            print(f"PrizePicks API status: {resp.status}")
            return None


async def fetch_odds_props(sport):
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


def parse_prizepicks(data):
    props = []
    if not data or "data" not in data:
        return props

    players = {}
    included = data.get("included", [])
    for item in included:
        if item.get("type") == "new_player":
            pid = item["id"]
            attrs = item.get("attributes", {})
            players[pid] = {
                "name": attrs.get("display_name", attrs.get("name", "Unknown")),
                "team": attrs.get("team", attrs.get("team_name", "")),
                "league": attrs.get("league", ""),
            }

    for proj in data["data"]:
        attrs = proj.get("attributes", {})
        player_id = None
        rels = proj.get("relationships", {})
        new_player = rels.get("new_player", {}).get("data", {})
        if new_player:
            player_id = new_player.get("id")

        player = players.get(player_id, {"name": "Unknown", "team": "", "league": ""})
        stat_type = attrs.get("stat_type", "")
        line = attrs.get("line_score", 0)
        league = attrs.get("league", player.get("league", ""))

        if stat_type and line:
            props.append({
                "player": player["name"],
                "team": player["team"],
                "league": league,
                "stat": stat_type,
                "line": float(line),
            })

    return props


def find_edges(pp_props, odds_games):
    edges = []

    stat_map = {
        # NBA
        "Points": "player_points",
        "Rebounds": "player_rebounds",
        "Assists": "player_assists",
        "Pts+Reb+Ast": "player_points",
        "Pts+Ast": "player_points",
        "Pts+Reb": "player_points",
        "3-PT Made": "player_threes",
        "Blocked Shots": "player_blocks",
        "Steals": "player_steals",
        # MLB
        "Pitcher Strikeouts": "pitcher_strikeouts",
        "Strikeouts": "pitcher_strikeouts",
        "Hits Allowed": "pitcher_hits_allowed",
        "Walks Allowed": "pitcher_walks",
        "Earned Runs Allowed": "pitcher_earned_runs",
        "Pitching Outs": "pitcher_outs",
        "Batter Strikeouts": "batter_strikeouts",
        "Hits": "batter_hits",
        "Home Runs": "batter_home_runs",
        "RBIs": "batter_rbis",
        "Total Bases": "batter_total_bases",
        "Runs Scored": "batter_runs_scored",
        "Stolen Bases": "batter_stolen_bases",
        # NFL
        "Passing Yards": "player_pass_yds",
        "Rushing Yards": "player_rush_yds",
        "Receiving Yards": "player_reception_yds",
        "Receptions": "player_receptions",
        "Passing TDs": "player_pass_tds",
        "Rushing Attempts": "player_rush_attempts",
        # NHL
        "Goals": "player_goals",
        "Shots on Goal": "player_shots_on_goal",
        "Points": "player_points",
    }

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

        over_outcomes = [o for o in sb_outcomes if o["side"].lower() == "over"]
        if not over_outcomes:
            continue

        best_over = min(over_outcomes, key=lambda x: x["point"])
        sb_line = best_over["point"]
        sb_price = best_over["price"]
        sb_prob = american_to_prob(sb_price)
        line_diff = pp_line - sb_line

        if line_diff > 0.5:
            edge_type = "UNDER"
            edge_desc = f"PP line ({pp_line}) HIGHER than books ({sb_line})"
            edge_score = line_diff
        elif line_diff < -0.5:
            edge_type = "OVER"
            edge_desc = f"PP line ({pp_line}) LOWER than books ({sb_line})"
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

    edges.sort(key=lambda x: x["edge_score"], reverse=True)
    return edges[:10]


@bot.event
async def on_ready():
    print(f"✅ {bot.user} is online and ready!")


@bot.command(name="pp")
async def prizepicks_lines(ctx, *, league: str = "MLB"):
    league_upper = league.upper()
    league_lower = league.lower()
    league_id = LEAGUE_IDS.get(league_lower)

    msg = await ctx.send(f"🔍 Fetching PrizePicks lines for **{league_upper}**...")

    data = await fetch_prizepicks(league_id)
    if not data:
        await msg.edit(content=f"❌ Could not fetch PrizePicks data. Try again later!")
        return

    props = parse_prizepicks(data)
    filtered = [p for p in props if league_upper in p["league"].upper()] if not league_id else props

    if not filtered:
        await msg.edit(content=f"❌ No props found for **{league_upper}** right now. Season may be inactive.")
        return

    embed = discord.Embed(
        title=f"🎯 PrizePicks — {league_upper} Lines",
        color=discord.Color.purple(),
        timestamp=datetime.utcnow()
    )
    embed.set_footer(text=f"PrizePicks current projections | {len(filtered)} props found")

    stat_groups = {}
    for prop in filtered:
        stat = prop["stat"]
        if stat not in stat_groups:
            stat_groups[stat] = []
        stat_groups[stat].append(prop)

    count = 0
    for stat, stat_props in list(stat_groups.items())[:5]:
        lines = []
        for p in stat_props[:6]:
            lines.append(f"**{p['player']}** ({p['team']}) — {p['line']}")
        embed.add_field(
            name=f"📊 {stat}",
            value="\n".join(lines),
            inline=False
        )
        count += 1

    await msg.edit(content=None, embed=embed)


@bot.command(name="pplookup")
async def prizepicks_player(ctx, *, player_name: str):
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

    lines = [f"**{prop['stat']}**: {prop['line']}" for prop in player_props]
    embed.add_field(name="📊 Current Lines", value="\n".join(lines), inline=False)
    embed.set_footer(text="PrizePicks current projections")

    await msg.edit(content=None, embed=embed)


@bot.command(name="edge")
async def find_edge(ctx, *, sport: str = "MLB"):
    sport_lower = sport.lower()
    if sport_lower not in SPORT_MAP:
        await ctx.send(f"❌ Use: {', '.join(SPORT_MAP.keys()).upper()}")
        return

    msg = await ctx.send(f"🔍 Finding edges for **{sport.upper()}**...")

    league_id = LEAGUE_IDS.get(sport_lower)
    pp_data = await fetch_prizepicks(league_id)
    odds_data = await fetch_odds_props(sport_lower)

    if not pp_data:
        await msg.edit(content="❌ Could not fetch PrizePicks data.")
        return

    pp_props = parse_prizepicks(pp_data)
    edges = find_edges(pp_props, odds_data)

    if not edges:
        await msg.edit(content=f"❌ No edges found for **{sport.upper()}** right now.")
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
                f"PrizePicks: **{edge['pp_line']}** | Books: **{edge['sb_line']}** ({price_str})\n"
                f"📊 {edge['edge_desc']} | {edge['sb_prob']}% implied prob"
            ),
            inline=False
        )

    await msg.edit(content=None, embed=embed)


@bot.command(name="pphelp")
async def pp_help(ctx):
    embed = discord.Embed(title="🎯 PrizePicks Helper Commands", color=discord.Color.purple())
    embed.add_field(name="!pp MLB", value="Show PrizePicks lines (NBA, NFL, MLB, NHL)", inline=False)
    embed.add_field(name="!pplookup PlayerName", value="Look up a specific player\nExample: `!pplookup Shohei Ohtani`", inline=False)
    embed.add_field(name="!edge MLB", value="Find edges vs sportsbooks\nWorks with: NBA, NFL, MLB, NHL", inline=False)
    await ctx.send(embed=embed)


bot.run(DISCORD_TOKEN)
