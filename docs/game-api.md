---
title: Game API
description: The endpoints the Krunker client reads without any authentication
---

These are the endpoints the game itself calls without a developer key and without a player token: the social popup, the clan window, Turf Wars, the market tab, the shop, the matchmaker and the two legacy browsers. Nothing here is documented by Krunker. Every endpoint, parameter and field below was taken from the game's client code and confirmed with a plain, unauthenticated `GET` in October 2026. All of it can change without notice.

In krapio these live under `krunker.game.*`, grouped by resource. Everything is read only: every write the game makes (follows, posts, purchases, listings, trades, clan management) needs the player's own token and is not part of this library.

## Hosts and envelopes

| Host | Used by | Reply shape |
| --- | --- | --- |
| `https://gapi.svc.krunker.io` | everything unless noted | `{"data": ..., "error": null}`; an error is `{"error": {"code", "message"}}` on a 404 or `{"error": "text"}` on a 400 |
| `https://matchmaker.krunker.io` | `matchmaker.*` | plain JSON, no envelope |
| `https://api.krunker.io` | `legacy.*` | plain JSON, `streams/top` wraps in `{"data"}` |

krapio unwraps the envelope, you get `data`. A non-null `error` on a 2xx (never seen, but the game checks for it) throws `KrunkerError`.

**Rate limits.** `gapi.svc.krunker.io` sends `X-RateLimit-Limit: 5`, `X-RateLimit-Remaining` and `X-RateLimit-Reset` on every reply: a window of 5 requests per second per endpoint, with `X-RateLimit-Reset` as seconds until the window ends (not a unix timestamp like the developer API). krapio waits out an empty window instead of refusing, since it is over within a second. The matchmaker and `api.krunker.io` send no rate limit headers.

**Names.** Player and clan name lookups are case-insensitive. Names go url-encoded into the path.

---

## Players

The social profile popup and its tabs.

### Get Player

```http
GET /players/:name
```

`krunker.game.players.get(playerName)`

The flat legacy profile the social popup renders. 404 `PLAYERS_NOT_FOUND` for an unknown name.

```ts
type PlayerSocialProfile = {
    player_id: number;
    player_name: string;
    player_clan?: string;          // absent without a clan
    clan_id?: number;
    player_twitchname: string;
    player_region: number;
    player_badge: string;          // comma separated badge ids
    player_titles: string;         // comma separated title ids
    player_datenew: string;        // "YYYY-MM-DD HH:MM:SS"
    player_featured: number;
    player_funds: number;          // kr
    player_skinvalue: number;
    player_elo: number;
    player_elo2: number;
    player_elo4: string;           // junk rating, a decimal as text
    player_premium: number;
    player_kills: number;
    player_deaths: number;
    player_wins: number;
    player_games_played: number;
    player_score: number;
    player_timeplayed: number;     // seconds
    player_following: number;
    player_followed: number;
    player_chal: number;
    player_infected: number;
    player_jobrating: number;
    player_jobratingpositive: number;
    player_calls: number;
    player_taggedaccounts: number;
    player_stats: PlayerStats;
    online: number;
    maps: unknown[];
    mods: unknown[];
    assets: unknown[];
    match_history: MatchHistoryGame[];   // only ever seen empty, shape from the game code
    ranked_rank: number;
    raid_stats: RaidStats[];
};
```

`player_stats` is a packed blob with short keys. The developer API's player profile has the same numbers under full names.

| Key | Meaning |
| --- | --- |
| s, h, hs, ls, wb | shots, hits, headshots, legshots, wallbangs |
| mk, fk, tmk | melee kills, fist kills (beatdowns), thrown weapon kills (bullseyes) |
| ast, n, ad, sad | assists, nukes, airdrops, airdrops stolen |
| sl, wm | slimes, warmachines |
| flg | country flag index |
| hds | 1 when the profile hides details |
| c0 to c15 | score per class |

`raid_stats` rows are `{map_id, completions, attempts, best_time, ai_kills, boss_kills, deaths}`.

### Search Players

```http
GET /players/search?q=:query&limit=:limit
```

`krunker.game.players.search(query, limit = 5)`

Prefix match on the name, `limit` 1 to 20. Returns `{player_id, player_name, player_score}[]` (krapio unwraps the `results` key).

### Get Player Sales

```http
GET /players/:name/sales?range=:days
```

`krunker.game.players.sales(playerName, range = 3)`

One row per day with market sales: `{f, t, d}[]` where `f` is kr earned, `t` items sold, `d` the day as `YYYY-MM-DD`. The popup sends `range=3`.

### Get Player Listings

```http
GET /players/:name/listings
```

`krunker.game.players.listings(playerName)`

Only ever answered `[]`. The developer API's player listings endpoint has the real data.

### Get Followers and Following

```http
GET /players/:name/followers
GET /players/:name/following
```

`krunker.game.players.followers(playerName)`, `krunker.game.players.following(playerName)`

`{player_id, player_name, date, follow_state}[]`, 100 rows at most.

### Get Player Feed

```http
GET /social/feed?player_id=:id&limit=:limit
```

`krunker.game.players.feed(playerId, limit = 20)`

A player's posts, `limit` 1 to 50. krapio returns the `posts` array of `FeedPost` (see [Social](#social) for the keys).

---

## Clans

The in-game clan window and the recruitment board.

### Get Clan by Name

```http
GET /clans/by-name/:name
```

`krunker.game.clans.byName(clanName)`

Case-insensitive. The roster carries no player ids.

```ts
type ClanPublicProfile = {
    clan_id: number;
    clan_name: string;
    clan_score: number;
    clan_funds: number;
    clan_rank: number;
    clan_link4: string;            // discord invite code
    clan_logo: number | null;      // logo version, 0 or null without one
    clan_banner_color: string;     // "s<n>" = paint shader n, otherwise a color
    creator_name: string;
    members: ClanPublicMember[];
};

type ClanPublicMember = {
    p: string;      // name
    s: number;      // score
    r: number;      // role: 0 recruit, 1 soldier, 2 captain, 3 commander; the creator is listed with 0
    h: number;      // hacker flag
    pr: number;
    ve: number;     // verified
    su: number;     // staff
    s7: number;     // score of the last 7 days
};
```

The clan logo is at `https://user-assets.krunker.io/clans/<clan_id>.png?v=<clan_logo>`.

### Get Clan by Id

```http
GET /clans/:id/profile
```

`krunker.game.clans.profile(clanId)`

The same reply as by name.

### Get Loot Config

```http
GET /clans/:id/loot-config
```

`krunker.game.clans.lootConfig(clanId)`

The clan's Turf Wars payout rule.

```ts
type ClanLootConfig = {
    clan_id: number;
    distribution_mode: "clan_bank" | "even" | "top_weighted" | "performance" | "top_performance";
    clan_pct: number;              // the treasury cut
    top_player_count: number;
    top_player_pct: number;        // top_player_pct + remainder_pct = 100
    remainder_pct: number;
    min_games_required: number;
    updated_at: string;
    updated_by: number;
    updated_by_name: string;
};
```

### Get Message of the Day

```http
GET /clans/:id/motd
```

`krunker.game.clans.motd(clanId)`

`{message, set_by, set_by_name, set_at}`.

### Get Recruitment Post

```http
GET /clans/:id/recruitment
```

`krunker.game.clans.recruitment(clanId)`

The clan's own post on the recruitment board.

```ts
type RecruitmentPost = {
    recruitment_id: number;
    clan_id: number;
    clan_name: string;
    clan_logo: number | null;
    description: string;
    looking_for: string;
    min_level: number;
    min_kd: number;
    region: string | null;
    language: string | null;
    is_active: number;
    created_at: string;
    updated_at: string;
    created_by: number;
    loot_mode: LootDistributionMode | null;
    loot_clan_pct: number | null;
    loot_top_player_count: number | null;
    loot_top_player_pct: number | null;
    loot_remainder_pct: number | null;
    loot_min_games: number | null;
};
```

### Get Recruitment Board

```http
GET /clans/recruitment?page=:page&limit=:limit&region=:region&language=:language
```

`krunker.game.clans.recruitmentBoard({ page, limit, region, language })`

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| page | int | no | 1 based |
| limit | int | no | 1 to 50, the game sends 20 |
| region | string | no | the board's region select |
| language | string | no | the board's language select |

Returns `{posts: RecruitmentPost[], total, page, limit}`.

---

## Turf Wars

`https://gapi.svc.krunker.io/territorial-wars/*`. Days are whole UTC days since the season epoch `2026-03-17` (`TURF_EPOCH_UTC`, `turfDay(date)` in krapio). `map_id` is the Turf map: 0 Burg, 2 Sandstorm, 3 Subzero (`TURF_MAPS`). Leaderboards return 100 rows, `kd` is a float.

### Get Status

```http
GET /territorial-wars/status
```

`krunker.game.turf.status()`

Every Turf map with its current owner and the top 5 clans.

```ts
type TurfStatus = {
    map_id: number;
    map_name: string;
    clan_id: number;               // the owner
    clan_name: string;
    clan_logo: number | null;
    kills: number;
    games: number;
    reward: number | null;
    leaderboard: { position: number; clan_id: number; clan_name: string; clan_logo: number | null; kills: number; deaths: number }[];
    total_kills_today: number;
    guaranteed_reward: number;
    estimated_reward: number;
};
```

### Get Clan

```http
GET /territorial-wars/clan/:clanId
```

`krunker.game.turf.clan(clanId)`

```ts
type TurfClan = {
    clan_id: number;
    clan_name: string;
    clan_logo: number | null;
    current_day: number;
    maps: TurfClanMap[];
    historical_days: Omit<TurfClanMap, "games">[];
};

type TurfClanMap = {
    map_id: number;
    map_name: string;
    day: number;
    kills: number;
    deaths: number;
    games: number;
    position: number;
    comparison_kills: number;      // the clan one position up
    comparison_deaths: number;
    comparison_clan_name: string;
    comparison_clan_id: number;
    comparison_clan_logo: number | null;
    comparison_position: number;
};
```

### Get Clan Players

```http
GET /territorial-wars/clan/:clanId/players?day=:day&map_id=:mapId
```

`krunker.game.turf.clanPlayers(clanId, { day, map_id })`

Today without `day`. Rows are `{player_id, player_name, kills, deaths, games, kd}`.

### Get Clan Earnings

```http
GET /territorial-wars/clan/:clanId/earnings
```

`krunker.game.turf.clanEarnings(clanId)`

`{day, map_id, map_name, reward}[]`.

### Get Clan Payouts

```http
GET /territorial-wars/clan/:clanId/payouts?day=:day
```

`krunker.game.turf.clanPayouts(clanId, day?)`

Season totals without `day`. `{payouts: {player_id, player_name, total_kr}[], total}`.

### Top Performing Clans

```http
GET /territorial-wars/leaderboards/top-performing-clans?day=:day&map_id=:mapId&clan_name=:name
```

`krunker.game.turf.topClans({ day, map_id, clan_name })`

`clan_name` is an exact match filter. Rows: `{position, clan_id, clan_name, clan_logo, kills, deaths, games, kd}`.

### Top Grossing Clans

```http
GET /territorial-wars/leaderboards/top-grossing-clans?clan_name=:name
```

`krunker.game.turf.topGrossing(clanName?)`

Rows: `{position, clan_id, clan_name, clan_logo, total_kr, distributed, bank}`.

### Top Performing Players

```http
GET /territorial-wars/leaderboards/top-performing-players?map_id=:mapId&player_name=:name
```

`krunker.game.turf.topPlayers({ map_id, player_name })`

Slow, several seconds. Rows: `{position, player_id, player_name, clan_id, clan_name, kills, deaths, games, kd, earnings}`.

### Get Player

```http
GET /territorial-wars/player/:playerId
```

`krunker.game.turf.player(playerId)`

Also the way to resolve a stored player id to the current name.

`{player_id, player_name, current_clan, current_clan_id, current_clan_logo, total_kills, total_deaths, total_games, kd, total_kr, first_day, last_day}`

### Get Player Contributions

```http
GET /territorial-wars/player/:playerId/contributions?day=:day
```

`krunker.game.turf.playerContributions(playerId, day?)`

Every day and map of the season without `day`. Rows: `{day, clan_id, clan_name, map_id, map_name, kills, deaths, games, kd}`.

### Get Player Earnings

```http
GET /territorial-wars/player/:playerId/earnings
```

`krunker.game.turf.playerEarnings(playerId)`

`{day, map_id, map_name, clan_id, clan_name, amount}[]`.

---

## Leaderboards

### Player Leaderboards

```http
GET /leaderboards/:type?sort=:sort&season=:season
```

`krunker.game.leaderboards.players(type, { sort, season })`

`type` is one of `player_score`, `player_kills`, `player_wins`, `player_timeplayed`, `player_funds`, `player_followed`, `player_nukes`, `player_skinvalue`, `player_eventcount`, `player_ranked_matches`. 100 rows of `{position, player_name, player_clan, player_featured, value}`.

### Clan Leaderboard

```http
GET /leaderboards/player_clan?sort=score|members
```

`krunker.game.leaderboards.clans(sort = "score")`

100 rows of `{position, clan_name, clan_score, member_count, hack_count}`.

### Raid Leaderboard

```http
GET /leaderboards/raids/:mapId?sort=time|completions
```

`krunker.game.leaderboards.raids(mapId, sort?)`

100 rows of `{position, player_name, player_clan, best_time, completions}`, `best_time` in milliseconds. Map ids with a raid board in October 2026: 18, 29, 31, 35 and 43 (`RAID_MAPS`). Any other id is a 400 `invalid raid map ID`.

### Monthly Raid Leaderboard

```http
GET /leaderboards/raids/:mapId/monthly?month=YYYY-MM&sort=time|completions
```

`krunker.game.leaderboards.raidsMonthly(mapId, month, sort?)`

`month` is required, as `YYYY-MM` (what the game sends). A bare number like `8` is also answered, with different rows of unknown meaning, so krapio only accepts `YYYY-MM`. A month without runs answers `{"data": null}`, which krapio returns as `[]`.

### KrunkCup

```http
GET /leaderboards/krunkcup/teams
GET /leaderboards/krunkcup/teams/:teamId/contributors
GET /leaderboards/krunkcup/players?limit=:limit
```

`krunker.game.leaderboards.krunkCupTeams()`, `.krunkCupContributors(teamId)`, `.krunkCupPlayers(limit?)`

Teams are `{id, total_kills, total_score, total_games}`. Contributors and players are `{position, player_name, player_clan, kills, score, games}`.

---

## Game

Static data the page loads at start, and the community map and mod records.

### Official Maps

```http
GET /maps
```

`krunker.game.game.maps()`

`{name, id}[]`. The id is also the preview image number at `https://assets.krunker.io/img/maps/map_<id>.png`.

### Map Config

```http
GET /maps/:id
```

`krunker.game.game.mapConfig(mapId)`

The whole map file (120 KB for Burg). krapio names only the keys the client reads (`name`, `modes`, `spawns`, `objects`, `sky`, `skyDome`), the rest is `Record<string, unknown>`.

### Community Map by Name

```http
GET /maps/by-name/:name
```

`krunker.game.game.mapByName(mapName)`

The community map record. Note that `Burg` resolves to a community map of that name, not the official map.

`{map_id, name, description, creator_name, votes, gameplays, playtime, category, created_at, updated_at, leaderboard_type, leaderboard_order, featured}`

### Community Map Leaderboard

```http
GET /maps/by-name/:name/leaderboard?page=:page&type=score|time&order=0|1
```

`krunker.game.game.mapLeaderboard(mapName, { page, type, order })`

25 per page. `{page, per_page, map_name, leaderboard_type, leaderboard_order, entries}`.

### Mod by Name

```http
GET /mods/by-name/:name
```

`krunker.game.game.modByName(modName)`

`{mod_id, name, description, creator_name, votes, featured, version, created_at, updated_at}`

### Titles

```http
GET /titles
```

`krunker.game.game.titles()`

Every player title with its requirement: `{id, name, desc, rarity, requirements: {kind, text} | null, active}[]`. Kinds seen: `challenge`, `bundle`, `blackmarket`.

### Creator Events

```http
GET /creators/events
```

`krunker.game.game.creatorEvents()`

The menu's event and survey box: `{events: unknown[], polls: {id, title, description, ends_in}[]}`, `ends_in` in seconds.

### Skins

```http
GET /data/skins
```

`krunker.game.game.skins()`

Every skin the client knows, about 8150 of them, loaded once at start. Unlike the rest of gapi this is `text/plain` in [jsonpack](https://www.npmjs.com/package/jsonpack) format, no envelope, 1.2 MB (190 KB gzipped). krapio decodes it. Its own rate limit: `X-RateLimit-Limit: 1000` per 60 seconds, `Cache-Control: public, max-age=300`.

The array index is the skin index the market, inventory and trades use. `id` is not: it is the texture or model number inside its weapon or slot (`weapon_1_107.png`), a string for paints, and missing on creator skins.

```ts
type GameSkin = {
    id?: number | string;
    name: string;
    rarity: number;
    seas: number;         // the season it came out in
    thumbnail: string;    // https://assets.krunker.io/textures/previews/...
    tradable: boolean;
    weapon?: number;      // weapon skins
    keyW?: string;        // the other slots: "Hat", "Back", "Knife", "Sprays", ...
    creator?: string;
    limited?: boolean;
    limT?: string;        // "Gift", "Twitch", "Charity", ...
    blackM?: boolean;     // black market: funds is the kr price, req/reqT the unlock requirement
    noSale?: boolean | number;
    noSpin?: boolean | number;
    noQuickSell?: boolean | number;
    // about 200 more keys of render config (offsets, shaders, sounds, paint masks)
};
```

### Spins

```http
GET /data/spins
```

`krunker.game.game.spins()`

The raw spin config, jsonpack like [Skins](#skins), `max-age=60`. `{itemPools: Record<string, {name, color, items}>, wheels}`: `items` are skin indices, a wheel's `pools` are keys of `itemPools` and `poolWeights` their chances in percent. It has the hidden and ended event wheels too (`hide`, `locked`, `startDate`, `endDate`); old ones carry only `rarities` and no `pools`. [Spin Wheels](#spin-wheels) is the shop's view of the live wheels with the pools inlined.

---

## Market

The reads of the market tab that answer without a token. Listings, the player's inventory and history need one, see the [token API](token-api.md).

### Market Stats

```http
GET /market/stats?cursor=&limit=&sort=&rarities=&weapons=&types=&season=&searchTerm=
```

`krunker.game.market.stats({ cursor, limit, sort, rarities, weapons, types, season, searchTerm })`

| Name | Type | Description |
| --- | --- | --- |
| cursor | int | `next_cursor` of the previous page |
| limit | int | 1 to 100 |
| sort | string | `rarity` is what the market tab sends; an unknown value is answered with the default order |
| rarities, weapons, types | int list | comma separated filters |
| season | int | |
| searchTerm | string | |

```ts
type MarketStats = {
    stats: { ski: number; inC: number; onS: number; high?: number; low?: number }[];
    has_more: boolean;
    next_cursor: number | null;
};
```

`ski` is the skin index, `inC` the count in circulation, `onS` the count on sale, `high` and `low` the ask range while something is listed (seen with `sort=rarity`, absent under other sorts). `onS` of a non tradable skin is noise: Atlantean Armour reports 20 on sale with zero listings anywhere.

### Item Sales Info

```http
GET /market/items/:id/sales
```

`krunker.game.market.itemSales(skinIndex)`

Despite the path, no sales: the ask range, the circulation and the player ids of the top owners.

```ts
type ItemSalesInfo = {
    ind: number;        // skin index
    high: number;       // highest ask, 0 without listings
    low: number;        // lowest ask, 0 without listings
    inC: number;        // count in circulation
    owners: number[];   // player ids of the top 100 owners, the same 100 the item view lists
};
```

The id list is capped at 100 and is never the whole owner base (Soul Essence, 6.7 million in circulation: 100 ids; Flame Tamer: 61 ids, and 61 owners on the item view). Measured 2026-10-17.

### Item Sales Statistics

```http
GET /market/items/:id/sales-statistics?daysback=:days
```

`krunker.game.market.itemSalesStatistics(skinIndex, daysBack = 30)`

One row per day with a sale: `{f, t, d}[]` (kr, count, `YYYY-MM-DD`). Reaches back about 85 days whatever `daysback` says (measured 2026-10-17 with 3650).

---

## Items

The item page of the social market, by skin index.

### Item View

```http
GET /items/:id/view
```

`krunker.game.items.view(skinIndex)`

The whole order book of the skin in one reply, not a page of it: every live listing (41 of 42 for Codefall Paint, the missing one had sold between two calls; the developer api's market endpoint pages 10), the top 100 owners, about two weeks of daily sales and the stats.

```ts
type ItemView = {
    stats: { onS: number; high: number; low: number; inC: number };
    owners: { nm: string; ct: number; su: number; ft: number; cr: number }[];   // top 100 by count: name, count owned, staff, featured, cr
    sales: { f: number; t: number; d: string }[];                              // kr, count, YYYY-MM-DD, days with a sale
    listings: ItemListing[];
    stackable: boolean;
    wearable: boolean;
};

type ItemListing = {
    uid: number;
    marketid: number;
    skinid: number;         // the item instance
    skinindex: number;
    funds: number;          // ask in kr
    seller_id: number;
    seller_name: string;
    listed_time: number;    // unix ms
    m?: string;             // json text {"wear": 0.9013, "serial": 32}, only on wearable skins
};
```

### Item Sales

```http
GET /items/:id/sales?range=:range
```

`krunker.game.items.sales(skinIndex, range = 6)`

Same rows as the market's sales statistics. The item page sends `range=6`, which reaches back about 120 days; `range=24` is answered 400 "invalid sales range".

### Item Instances

```http
GET /items/:id/instances?sort=mint
```

`krunker.game.items.instances(skinIndex, sort = "mint")`

The Mints and Wear tabs of a non stackable skin (the serial numbered Season 10 items): every instance's holder name, serial and, on wearable skins, wear. Stackable skins answer `[]`. Capped at 100 rows and not pageable: `page`, `offset`, `limit` and `cursor` are ignored, and any sort other than `mint` and `wear` falls back to `mint`. So a skin with up to 100 instances is complete (Roselle: 60, Bren Gun: 64), a bigger one gives the 100 lowest serials and the 100 lowest wears.

```ts
type ItemInstance = {
    nm: string;       // holder's name
    serial: number;
    wear?: number;    // wearable skins only
};
```

---

## Social

### Feed

```http
GET /social/feed?tab=global&limit=:limit
```

`krunker.game.social.feed(tab = "global", limit?)`

`global` is the only tab seen; an unknown one is a 400 `SOCIAL_INVALID_TAB`. `limit` 1 to 50. krapio returns the `posts` array.

```ts
type FeedPost = {
    pid: number;      // post id
    pln: string;      // poster name
    pli: number;      // poster id
    tim: number;
    lnk: string;
    txt: string;
    ftr: number;
    typ: number;
    cln: string;
    flw: number;
    clr: number;
    prm: number;
    lnk2: string;
    vot: number;      // votes
    dlk: number;
    cnt: number;      // comment count
    exp: number;
    fds: number;
};
```

### Post

```http
GET /social/post/:id
```

`krunker.game.social.post(postId)`

`{post: FeedPost, comments: unknown[]}`.

### News

```http
GET /social/news
```

`krunker.game.social.news()`

`{news: unknown[]}`, only seen empty.

---

## Shop

The shop's catalogue. The wild offer and every purchase need the player's token.

### Display

```http
GET /shop/displays/:id
GET /shop/displays?tag=:tag
```

`krunker.game.shop.display(displayId)`, `krunker.game.shop.displayByTag(tag)`

Display 1 is the front page, `tag=premium` is what the menu asks for. `/shop/displays` without a tag answers 400.

```ts
type ShopDisplay = {
    id: number;
    type: string;
    order: number;
    data: Record<string, unknown>;
    children: { id: number; parent_id: number; order: number; type: string; data: Record<string, unknown>; product_id?: number }[];
    products: Record<string, ShopProduct>;
};

type ShopProduct = {
    id: number;
    name: string;
    description: string;
    image_url: string;
    active: boolean;
    prices: { id: number; price_ref: string; type: string; real?: { price_usd: number }; recurring?: { amount: number; periodicity: string }; available: boolean }[];
    contents: { id: number; type: string; ref: string; quantity: number }[];
    available: boolean;
    display_ids: number[];
};
```

### Spin Wheels

```http
GET /spins/wheels
```

`krunker.game.shop.spinWheels()`

Every wheel with its pools and weights: `{index, name, price, ticketIndex, ticketOnly, multi, poolWeights, pools: {id, name, color, weight, items}[]}[]`, `items` are skin indices.

### Lottery

```http
GET /lottery/:id
```

`krunker.game.shop.lottery(lotteryId)`

Id 1 is the running one. `{lottery: {id, title, frequency, theme}, player_entries, total_entries, previous_draws: {id, lottery_id, starts_at, ends_at, drawn_at, prizes}[]}`. `player_entries` is 0 without a token.

---

## Matchmaker

`https://matchmaker.krunker.io`, plain JSON without an envelope. The game polls the list every 60 seconds. krapio adds `hostname=krunker.io` to every call.

### Game List

```http
GET /game-list?hostname=krunker.io
```

`krunker.game.matchmaker.gameList()`

Every public lobby, about 47 KB.

```ts
type GameList = {
    games: GameListEntry[];
    totalPlayerCount: number;
};

// [game id, region key, players, max players, options, seconds left]
type GameListEntry = [string, string, number, number, GameOptions, number];

type GameOptions = {
    v: string;      // game version
    g: number;      // gamemode id
    c: number;      // custom game
    cm: number;
    m: number;      // map index
    i: string;      // map name
};
```

### Ping List

```http
GET /ping-list?hostname=krunker.io
```

`krunker.game.matchmaker.pingList()`

Region key (as in a game entry) to a lobby `host:port` to ping.

### Game Info

```http
GET /game-info?game=:gameId
```

`krunker.game.matchmaker.gameInfo(gameId)`

One lobby as a game list entry. Ids look like `FRA:4kpj2`.

### Joining a Game

Not wrapped: seeking takes a slot on a lobby and can ask for a captcha. This is what the game does, recorded once in November 2026.

| Request | Reply |
| --- | --- |
| `GET /generate-token` | a validation token |
| `GET /seek-game?hostname=krunker.io&region=:region&autoChangeGame=false&validationToken=:token&dataQuery={"v":":build"}&accessToken=:frvrToken[&captchaToken=:turnstile]` | the lobby to connect to |

`/generate-token` is plain text, `<unix seconds>:<base64 of 32 bytes>`. The game fetches a fresh one for every seek. `dataQuery.v` is the client build, and `accessToken` is the FRVR token (the anonymous one before login) as a query parameter, not a header.

The first seek of the page came back `400 {"error":"CaptchaRequired"}`. The game then rendered a Cloudflare Turnstile widget (sitekey `0x4AAAAAAD19NTFH3Itq7QOn`, the same one the [login](token-api.md#login) uses), which passed without any interaction about 2.4 seconds later. It then fetched a new validation token and repeated the seek with `captchaToken=1.…`:

```json
{"changeReason": null, "gameId": "FRA:5awji", "host": "lobby-n6427-jf8nq.frankfurt.krunker.io", "port": 3000, "clientId": "406de4eb-…", "data": {"t": "d", "p": 62.3, "l": 41.3, "d": 21.0, "b": 2, "n": false}}
```

`data` is not read by anything visible. The game copies it into its analytics as `seek_t`, `seek_p`, … .

---

## Legacy

`https://api.krunker.io`, the old REST API. Only the paths the page calls without a token.

### Map Browser

```http
GET /webhooks/general/maps/list?index=:index&pos=:pos
```

`krunker.game.legacy.mapsList({ index, pos })`

`index` is the category tab, `pos` the page, both 0 based. `{index, data: {map_id, map_name, map_votes, creatorname, map_featured, map_info, map_updatecounter, map_pl, fund, category, partner, map_date}[]}`, `map_info` is JSON text.

### Mod Browser

```http
GET /webhooks/general/mods/list?index=:index&pos=:pos
```

`krunker.game.legacy.modsList({ index, pos })`

`{index, data: {mod_id, mod_name, mod_votes, creatorname, mod_featured, mod_url, mod_info, mod_updatecounter}[]}`.

### Item Prices

```http
GET /webhooks/general/items/prices
```

`krunker.game.legacy.itemPrices()`

The kr value per skin the inventory shows: an array indexed by skin index, `null` where there is no price. About 8000 entries, 38 KB.

### Top Streams

```http
GET /streams/top?cb=2
```

`krunker.game.legacy.topStreams()`

The menu's stream box plus the running drop campaigns. krapio unwraps the `data` key.

```ts
type TopStreams = {
    streams: { id: string; username: string; title: string; viewerCount: number; thumbnailUrl: string; startedAt: string; provider: string; featured: boolean; languageCode: string }[];
    promo: boolean;
    dropCampaigns: { name: string; startDate: number; endDate: number; drops: { itemId: number }[]; startDateISO: string; endDateISO: string }[];
};
```
