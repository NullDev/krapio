---
title: Token API
description: The endpoints the Krunker client reads with the player's own access token
---

These are the reads the game makes with the player's FRVR access token: the wallet, inventory, trades, custom skins, the live market listings, and the ranked system's own API on `api.krunker.io`. Nothing here is documented by Krunker. Every endpoint below was taken from the game's client code and confirmed once with a real token in October 2026, read only. All of it can change without notice.

In krapio these live under `krunker.as(token).*`. The token is sent as a bearer header and nothing else: never stored, never logged, never used for a write. Every write the game makes with it (purchases, listings, trades, follows, posts, studio and map management) is left out on purpose.

## The token

The game gets it from `FRVR.auth.getFreshAccessToken()`: an RS256 JWT with the claims `sub` (the player's FRVR user id), `iss`, `iat`, `exp` and `extra`, valid for about 24 hours.

krapio decodes the claims without verifying the signature (Krunker does that) so a malformed or expired token throws `KrunkerTokenError` before any request, and exposes them as `session.claims`. `claims.sub` is the only stable key to cache anything read here under, never the token itself.

```ts
const me = krunker.as(token);
me.claims.sub;                       // "frvr user id"
await me.player.wallet();
```

## Hosts, envelopes and errors

| Host | Used by | Reply shape |
| --- | --- | --- |
| `https://gapi.svc.krunker.io` | everything unless noted | `{"data": ..., "error": null}`, unwrapped by krapio |
| `https://api.krunker.io` | `ranked.*` | `{"data": ...}` without an error field on success, unwrapped by krapio |

| Status | When |
| --- | --- |
| 401 `invalid token` | bad signature or expired; `Access token required` on `api.krunker.io` without a header |
| 403 `insufficient permissions`, `not authorized` | a role gated endpoint (see [Staff](#staff)) |

Some replies carry their refusal inside `data` with a 200, see the wild offer.

The rate limit headers are the same as for the [game API](game-api.md#hosts-and-envelopes): 5 requests per second per endpoint on `gapi.svc.krunker.io`, none on `api.krunker.io`.

---

## Player

The token's own account.

### Me

```http
GET /player/me
```

`me.player.me()`

`{player: {id, name, data}}`, where `data` is the packed account blob the game decodes itself.

### Wallet

```http
GET /player/wallet
```

`me.player.wallet()`

Kr plus every studio currency.

```ts
type Wallet = {
    currencies: { id: number; name: string; symbol: string; amount: number }[];
    spending_tier: number;
};
```

### Guest Profile

```http
GET /guest/profile
```

`me.player.guestProfile()`

The stats of a guest token: `{profile: {score, funds, kills, deaths, games, wins}}`, zeros for a registered account.

### Usernames

```http
GET /account/usernames
```

`me.player.usernames()`

The active name, the reserved names and the rename cooldown.

```ts
type Usernames = {
    active: string;
    names: { name: string; state: string; leave_release_secs: number }[];
    cooldown_secs: number;
};
```

### Email Preferences

```http
GET /email/preferences
```

`me.player.emailPreferences()`

`{chosen, promotional}`.

### Discord Status

```http
GET /discord/status
```

`me.player.discordStatus()`

`{configured, linked, id?, username?, globalName?, avatar?, linkedAt?, guildUrl?, inGuild?}`, the optional fields only while linked.

---

## Market

The market behind a login. Market stats and item pages answer without a token, see the [game API](game-api.md#market).

### Listings

```http
GET /market/listings?item_id=&items=&sort=&cursor_id=&limit=&rarities=&weapons=&types=&wears=&season=&painted=&searchTerm=
```

`me.market.listings({ item_id, items, sort, cursor_id, limit, rarities, weapons, types, wears, season, painted, searchTerm })`

What the market tab shows. A token is required although the data is not about the player.

| Name | Type | Description |
| --- | --- | --- |
| item_id | int | one skin index |
| items | int list | several skin indices |
| sort | string | `latest`, `price_asc`, `price_desc` or `popular` |
| cursor_id | int | the last `uid` of the previous page |
| limit | int | 1 to 100 |
| rarities, weapons, types, wears | int list | comma separated filters |
| season | int | |
| painted | bool | sent as `1` when true |
| searchTerm | string | |

```ts
type MarketListings = {
    listings: LiveListing[];
    has_more: boolean;
    next_cursor_id: number | null;   // the cursor_id of the next page
};

type LiveListing = {
    uid: number;
    marketid: number;
    skinid: number;          // the item instance
    skinindex: number;
    funds: number;           // asking price in kr
    seller_id: number;
    seller_name: string;
    listed_time: number;     // unix ms
    listing_count: number;   // how many of this skin the seller has listed
};
```

100 listings per page. Opening the market tab loads `sort=latest`; browsing by price walks `sort=price_asc` page by page through `next_cursor_id` (13 pages in 4 seconds in one recording), an item page loads `item_id=&sort=price_asc`.

### Inventory

```http
GET /market/inventory
```

`me.market.inventory()`

The player's stacks: `{i, cnt, sid, st}[]` (skin index, count, instance id, state).

### Sales

```http
GET /market/sales
```

`me.market.sales()`

The player's own open listings, `[]` when there are none.

```ts
type OpenListing = {
    uid: number;
    marketid: number;
    skinid: number;          // the item instance
    skinindex: number;
    funds: number;           // asking price in kr
    listed_time: number;     // unix ms
};
```

### History

```http
GET /market/history?sort=&cursor=&limit=
```

`me.market.history({ sort, cursor, limit })`

The player's completed buys and sells, newest first by default. `sort` is one of `date_asc`, `date_desc`, `amount_asc`, `amount_desc`, `item_asc`, `item_desc`; `limit` 1 to 100.

```ts
type MarketHistory = {
    history: {
        marketid: number;
        type: "sell" | "buy";
        date: string;
        skinindex: number;
        amount: number;
        other_party_id: number;
        other_party_name: string;
        status: string;            // "completed"
    }[];
    has_more: boolean;
    next_cursor: number | null;    // the cursor of the next page
};
```

`date` is when the sale went through, a few seconds after the buyer's `POST /market/purchase` returned in one recording.

### Black Market

```http
GET /market/black-market
GET /market/black-market/rank
```

`me.market.blackMarket()`, `me.market.blackMarketRank()`

The skin indices on offer, and `{peak_mmr}` (null without a ranked history), the player's peak MMR for the ranked tier of the black market.

---

## Trades

Player to player trades. Creating, accepting and cancelling are writes and are not in krapio.

### History

```http
GET /trades/history?offset=&limit=&include_open=
```

`me.trades.history({ offset, limit, includeOpen })`

Open and completed trades of the player, `limit` 1 to 100. krapio sends `include_open=0` only when `includeOpen` is `false`.

```ts
type TradeHistory = {
    open: Trade[];
    completed: Trade[];
    completed_has_more?: boolean;
};

type Trade = {
    trid: number;
    sksell: { ind: number }[];         // items the offering player gives
    skbuy: { ind: number }[];          // items asked from the other player
    csell: { cid: number; amt: number }[];
    cbuy: { cid: number; amt: number }[];
    pl: number;                        // id of the player who made the offer
    buy: number;                       // id of the player the offer went to
    buyer: string;                     // name of the player the offer went to
    player: string;                    // name of the player who made the offer
    message: string;
    dte: string;                       // when the offer was made, "YYYY-MM-DD HH:MM:SS" utc
};
```

The sides follow the offer, not the reader: in the recipient's history `pl` and `player` are still the other player. `cid` 1 is kr. A completed trade keeps the `dte` of its offer, so an open trade and the same trade completed are identical apart from the list they are in. The trading window loads this with `include_open` on, and again with `include_open=0` about a second after an accept.

### Trade Inventories

```http
GET /trades/inventory/:playerId
```

`me.trades.inventory(playerId)`

Both inventories side by side: `{my_inventory, their_inventory}`, each `{i, cnt, sid, st}[]`.

### Player Search

```http
GET /trades/player-search?name=:name
```

`me.trades.playerSearch(playerName)`

One player by exact name: `{player_id, player_name, player_score}`.

---

## Market and Trade Writes

What the game posts when the player buys, lists or trades. krapio never sends any of these: they are here so a client that only reads what the game already did (a DevTools observer, a proxy) knows the shapes. Recorded once each in October 2026. The reply types are exported anyway (`MarketListResult`, `MarketPurchaseResult`, ...).

| Request | Body | Reply `data` | The game then loads |
| --- | --- | --- | --- |
| `POST /market/list` | `{item_id, price, skin_id}` (skin index, kr, instance id) | `{funds, cnt, marketid}`: kr left, stack left of that skin, the new listing | `/market/inventory`, `/market/sales` |
| `POST /market/unlist` | `{market_id}` | `{response: "SUCCESS"}` | `/market/inventory`, `/market/sales` |
| `POST /market/purchase` | `{market_id}` | `{playerfunds, sid, mid, skn}`: kr left, the bought instance, the listing's market id and skin index | the listings again, not the history |
| `POST /trades/create` | `{target_player_id, my_offer: {i, c}[], their_offer: {i, c}[], message}` | `{funds}` | `/trades/history` |
| `POST /trades/:id/accept` | none | `{funds}` | `/trades/history?include_open=0` about a second later, with the trade under `completed` |
| `POST /trades/:id/cancel` | none | `{success: true}` | nothing right away |
| `POST /trades/decline-all` | none | not recorded | |

The purchase reply has no price: it is the `funds` of that `marketid` in the listings the game loaded before, or `amount` in the buyer's market history later. Declining one incoming offer was not recorded; the game code has only `/cancel` and `/decline-all` for it.

Refusals come as 400 with `{error: string}` and no `data`. Seen: `"Try again in 60 seconds"` (two accepts of an offer made 9 s and 89 s before, the third after 2.5 minutes went through), `"Market is busy. Please try again in a few seconds."` (a second list 5 s after the first), `"Try again in a few seconds"` (an unlist 23 s after listing).

---

## Shop

Per player shop state and the player's own custom skins.

### Ranked Shop

```http
GET /ranked/shop
```

`me.shop.ranked()`

The skins bought with ranked currency, with the player's purchase counts: `{skins: {id, skin_id, price, max_purchase, purchase_count}[]}`.

### Wild Offer

```http
GET /shop/wild-offer
```

`me.shop.wildOffer()`

A 200 with `{error: "Wild offer is not available"}` inside `data` when there is none. krapio returns that object as is, check for an `error` key.

### Wristband

```http
GET /krunkcup/wristband
```

`me.shop.wristband()`

The player's KrunkCup wristband skin and whether it was claimed: `{skin_index, claimed, style, instance_id}`.

### Custom Skins

```http
GET /skins?page=&page_size=&type=&weapon=&search=
GET /skins/:id
```

`me.shop.customSkins({ page, page_size, type, weapon, search })`, `me.shop.customSkin(skinId)`

The player's own skins from the skin editor, `page_size` 1 to 100.

```ts
type CustomSkinsPage = {
    skins: CustomSkin[];
    total: number;
    page: number;
    pageSize: number;
};

type CustomSkin = {
    skinId: number;
    name: string;
    type: number;
    weapon: number;
    rarity: number;
    itemConfig: Record<string, unknown>;
    playerId: number;
    createdAt: string;
    updatedAt: string;
};
```

---

## Creator

What a creator sees of their own maps and studios, plus the player's clan applications. The studio replies are untyped in krapio (`unknown`), only their existence was verified.

### Clan Applications

```http
GET /clans/my-applications
```

`me.creator.clanApplications()`

`{clan_ids: number[] | null}`, null without any.

### Map Versions

```http
GET /maps/:id/versions
```

`me.creator.mapVersions(mapId)`

The version history of an own map, empty for a map that is not yours.

### Map Data

```http
GET /maps/:id/data?player=:name
```

`me.creator.mapData(mapId, playerName)`

A map's stored key value data for one player (the key value store of map scripts).

### Studios

```http
GET /studios/mine
GET /studios/invites
GET /studios/:id
GET /studios/:id/monetization
GET /studios/:id/analytics
GET /studios/:id/skins
```

`me.creator.studios()`, `.studioInvites()`, `.studio(id)`, `.studioMonetization(id)`, `.studioAnalytics(id)`, `.studioSkins(id)`

---

## Staff

Role gated reads for moderators and KPD reviewers. A normal account gets a 403 `insufficient permissions` (or `not authorized` for reports). The replies are untyped in krapio, no account with the role was available to verify them.

```http
GET /moderation/chat/:name
GET /players/:name/reports
GET /kpd/demos?off=&q=
GET /kpd/demos/:id?ct=
GET /kpd/reviewers
```

`me.staff.chatBan(playerName)`, `.reports(playerName)`, `.kpdDemos({ off, q })`, `.kpdDemo(demoId, ct?)`, `.kpdReviewers()`

`chatBan` is a player's chat ban, `kpdDemos` the demo review queue (`off` is the offset, `q` a search), `kpdDemo` one demo where `ct` is the review ticket the game passes along.

---

## Ranked

`https://api.krunker.io`, the ranked system's own API. Every call answers 401 `Access token required` without a token, including the public leaderboard.

### Season Rankings

```http
GET /leaderboards/rankings/season/:season?limit=&offset=
GET /leaderboards/rankings/season/:season/region/:region?limit=&offset=
```

`me.ranked.leaderboard(season, { limit, offset, region })`

The game reads 40 per page; `limit` 1 to 100, `offset` 0 based. Regions are the ranked region ids (2 Asia, 3 Europe, 4 North America).

```ts
type SeasonRankings = {
    leaderboard: { position: number; profile: { player_name: string; conservative_rating: number; total_matches: number; rank: number } }[];
    totalPages: number;
};
```

### Ranked Profile

```http
GET /player-profile/me/season/:season
GET /player-profile/me/season/:season/region/:region
```

`me.ranked.profile(season, region?)`

The player's ranked card with season totals. `total_accuracy` here is the only aggregate ranked accuracy anywhere in Krunker's APIs, and it is own account only.

```ts
type RankedProfile = {
    profile: {
        player_id: number;
        season: number;
        rank: number;
        mu: number;
        sigma: number;
        conservative_rating: number;
        wins: number;
        losses: number;
        total_matches: number;
        total_kills: number;
        total_deaths: number;
        total_assists: number;
        total_score: number;
        total_objective_score: number;
        total_accuracy: number;
        total_damage_done: number;
        total_time_played: number;
        highest_kill_count: number;
        highest_damage_in_match: number;
        player_score: number;
        level: number;
        last_milestone_claimed: number;
        player_name: string;
    };
    milestones: { id: number; matches: number; reward: number }[];
};
```

### Match History

```http
GET /match-history/me/season/:season/gameMode/:mode/isRanked/:ranked?limit=&offset=
GET /match-history/me/season/:season/gameMode/:mode/isRanked/:ranked/region/:region?limit=&offset=
```

`me.ranked.matchHistory(season, { limit, offset, gameMode, isRanked, region })`

`:mode` is a gamemode id or the literal `undefined` for all modes (that is what the game sends, and the API accepts it), `:ranked` is `true`, `false` or `all`. The game reads 5 per page. Returns `{matchHistory: {matches, totalPages}}`.

### Connection

```http
GET /ranked/me/connection
```

`me.ranked.connection()`

The ranked lobby the player is bound to: `{serverUrl}`, null without one.

### Daily Spin

```http
GET /daily-spin/progress
```

`me.ranked.dailySpin()`

The daily spin meter: `{score, maxScore, stage, timeRemaining, claimed}`, `timeRemaining` in seconds.
