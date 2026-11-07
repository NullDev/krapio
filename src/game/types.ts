// ========================= //
// = Copyright (c) NullDev = //
// =     - SPDX: MIT -     = //
// ========================= //

// shapes of what the game reads without auth, from live replies and the game code; none of it is documented by krunker

/** the reply envelope of gapi.svc.krunker.io, a non-null error comes with a 4xx or 5xx */
export type Envelope<T> = {
    data: T;
    error: null | string | { code?: string; message?: string };
};

/** the packed stats blob of a social profile, the developer api's profile has the same numbers under full names */
export type PlayerStats = {
    /** shots */
    s: number;
    /** hits */
    h: number;
    /** headshots */
    hs: number;
    /** legshots */
    ls: number;
    /** wallbangs */
    wb: number;
    /** melee kills */
    mk: number;
    /** fist kills (beatdowns) */
    fk: number;
    /** thrown weapon kills (bullseyes) */
    tmk: number;
    /** assists */
    ast: number;
    /** nukes */
    n: number;
    /** airdrops */
    ad: number;
    /** airdrops stolen */
    sad: number;
    /** slimes */
    sl: number;
    /** warmachines */
    wm: number;
    /** country flag index */
    flg: number;
    /** 1 when the profile hides details */
    hds: number;
    /** score per class, c0 to c15 */
    c0?: number;
    /** score with class 1 */
    c1?: number;
    /** score with class 2 */
    c2?: number;
    /** score with class 3 */
    c3?: number;
    /** score with class 4 */
    c4?: number;
    /** score with class 5 */
    c5?: number;
    /** score with class 6 */
    c6?: number;
    /** score with class 7 */
    c7?: number;
    /** score with class 8 */
    c8?: number;
    /** score with class 9 */
    c9?: number;
    /** score with class 10 */
    c10?: number;
    /** score with class 11 */
    c11?: number;
    /** score with class 12 */
    c12?: number;
    /** score with class 13 */
    c13?: number;
    /** score with class 14 */
    c14?: number;
    /** score with class 15 */
    c15?: number;
} & Record<string, number | string | undefined>;

/** one player's line in a match of a social profile's match_history */
export type MatchHistoryEntry = {
    player_name: string;
    accuracy: number;
    assists: number;
    damage_done: number;
    deaths: number;
    headshots: number;
    kills: number;
    objective_score: number;
    score: number;
    team: number;
    rank: number;
    mmr_change: number;
};

/** one match in a social profile's match_history */
export type MatchHistoryGame = {
    date: string;
    map: number;
    duration: number;
    mode: number;
    season: number;
    region: number;
    is_competitive: number;
    is_ranked: number;
    match_history_processed: number;
    historyEntries: MatchHistoryEntry[];
    score_alpha: number;
    score_bravo: number;
};

/** a player's raid stats on one map */
export type RaidStats = {
    map_id: number;
    completions: number;
    attempts: number;
    best_time: number;
    ai_kills: number;
    boss_kills: number;
    deaths: number;
};

/** GET /players/:name, the legacy flat profile the social popup renders */
export type PlayerSocialProfile = {
    player_id: number;
    player_name: string;
    /** absent without a clan */
    player_clan?: string;
    clan_id?: number;
    player_twitchname: string;
    player_region: number;
    /** comma separated badge ids */
    player_badge: string;
    /** comma separated title ids */
    player_titles: string;
    /** "YYYY-MM-DD HH:MM:SS" */
    player_datenew: string;
    player_featured: number;
    /** kr */
    player_funds: number;
    player_skinvalue: number;
    player_elo: number;
    player_elo2: number;
    /** junk rating, a decimal as text */
    player_elo4: string;
    player_premium: number;
    player_kills: number;
    player_deaths: number;
    player_wins: number;
    player_games_played: number;
    player_score: number;
    /** seconds */
    player_timeplayed: number;
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
    /** shape from the game code, only seen empty */
    match_history: MatchHistoryGame[];
    ranked_rank: number;
    raid_stats: RaidStats[];
};

/** one hit of GET /players/search */
export type PlayerSearchResult = {
    player_id: number;
    player_name: string;
    player_score: number;
};

/** one day of market sales: funds earned, count sold, date */
export type PlayerSale = {
    f: number;
    t: number;
    /** YYYY-MM-DD */
    d: string;
};

/** one row of GET /players/:name/followers and /following */
export type PlayerFollow = {
    player_id: number;
    player_name: string;
    date: string;
    follow_state: number;
};

/** one post of the social feed, short keys as the game sends them */
export type FeedPost = {
    /** post id */
    pid: number;
    /** poster name and id */
    pln: string;
    /** poster id */
    pli: number;
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
    /** votes */
    vot: number;
    dlk: number;
    /** comment count */
    cnt: number;
    exp: number;
    fds: number;
};

/** one member in a public clan profile, short keys as the game sends them */
export type ClanPublicMember = {
    /** name */
    p: string;
    /** score */
    s: number;
    /** role: 0 recruit, 1 soldier, 2 captain, 3 commander; the creator is listed with 0 */
    r: number;
    /** hacker flag */
    h: number;
    pr: number;
    /** verified */
    ve: number;
    /** staff */
    su: number;
    /** score of the last 7 days */
    s7: number;
};

/** GET /clans/by-name/:name and /clans/:id/profile */
export type ClanPublicProfile = {
    clan_id: number;
    clan_name: string;
    clan_score: number;
    clan_funds: number;
    clan_rank: number;
    /** discord invite code */
    clan_link4: string;
    /** logo version, 0 or null without one; image at user-assets.krunker.io/clans/<clan_id>.png?v=<clan_logo> */
    clan_logo: number | null;
    /** "s<n>" = paint shader n, otherwise a color */
    clan_banner_color: string;
    creator_name: string;
    members: ClanPublicMember[];
};

/** how a clan splits its turf earnings */
export type LootDistributionMode = "clan_bank" | "even" | "top_weighted" | "performance" | "top_performance";

/** GET /clans/:id/loot-config */
export type ClanLootConfig = {
    clan_id: number;
    distribution_mode: LootDistributionMode;
    /** the treasury cut */
    clan_pct: number;
    top_player_count: number;
    /** top_player_pct + remainder_pct = 100 */
    top_player_pct: number;
    remainder_pct: number;
    min_games_required: number;
    updated_at: string;
    updated_by: number;
    updated_by_name: string;
};

/** GET /clans/:id/motd */
export type ClanMotd = {
    message: string;
    set_by: number;
    set_by_name: string;
    set_at: string;
};

/** a clan's post on the recruitment board */
export type RecruitmentPost = {
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

/** GET /clans/recruitment, paged */
export type RecruitmentBoard = {
    posts: RecruitmentPost[];
    total: number;
    page: number;
    limit: number;
};

/** one of the top 5 clans of a turf map */
export type TurfStatusEntry = {
    position: number;
    clan_id: number;
    clan_name: string;
    clan_logo: number | null;
    kills: number;
    deaths: number;
};

/** one turf map with its current owner */
export type TurfStatus = {
    map_id: number;
    map_name: string;
    /** the owner */
    clan_id: number;
    clan_name: string;
    clan_logo: number | null;
    kills: number;
    games: number;
    reward: number | null;
    /** top 5 */
    leaderboard: TurfStatusEntry[];
    total_kills_today: number;
    guaranteed_reward: number;
    estimated_reward: number;
};

/** a clan's standing on one turf map for one day */
export type TurfClanMap = {
    map_id: number;
    map_name: string;
    day: number;
    kills: number;
    deaths: number;
    games: number;
    position: number;
    /** the clan one position up */
    comparison_kills: number;
    comparison_deaths: number;
    comparison_clan_name: string;
    comparison_clan_id: number;
    comparison_clan_logo: number | null;
    comparison_position: number;
};

/** GET /territorial-wars/clan/:id */
export type TurfClan = {
    clan_id: number;
    clan_name: string;
    clan_logo: number | null;
    current_day: number;
    maps: TurfClanMap[];
    historical_days: Omit<TurfClanMap, "games">[];
};

/** one row of GET /territorial-wars/clan/:id/players */
export type TurfPlayerRow = {
    player_id: number;
    player_name: string;
    kills: number;
    deaths: number;
    games: number;
    kd: number;
};

/** one day's reward of a clan on one map */
export type TurfClanEarning = {
    day: number;
    map_id: number;
    map_name: string;
    reward: number;
};

/** GET /territorial-wars/clan/:id/payouts */
export type TurfPayouts = {
    payouts: { player_id: number; player_name: string; total_kr: number }[];
    total: number;
};

/** one row of the top performing clans board */
export type TurfTopClan = {
    position: number;
    clan_id: number;
    clan_name: string;
    clan_logo: number | null;
    kills: number;
    deaths: number;
    games: number;
    kd: number;
};

/** one row of the top grossing clans board */
export type TurfTopGrossingClan = {
    position: number;
    clan_id: number;
    clan_name: string;
    clan_logo: number | null;
    total_kr: number;
    distributed: number;
    bank: number;
};

/** one row of the top performing players board */
export type TurfTopPlayer = {
    position: number;
    player_id: number;
    player_name: string;
    clan_id: number;
    clan_name: string;
    kills: number;
    deaths: number;
    games: number;
    kd: number;
    earnings: number;
};

/** GET /territorial-wars/player/:id */
export type TurfPlayer = {
    player_id: number;
    player_name: string;
    current_clan: string;
    current_clan_id: number;
    current_clan_logo: number | null;
    total_kills: number;
    total_deaths: number;
    total_games: number;
    kd: number;
    total_kr: number;
    first_day: number;
    last_day: number;
};

/** one day and map of a player's turf contributions */
export type TurfContribution = {
    day: number;
    clan_id: number;
    clan_name: string;
    map_id: number;
    map_name: string;
    kills: number;
    deaths: number;
    games: number;
    kd: number;
};

/** one payout to a player */
export type TurfPlayerEarning = {
    day: number;
    map_id: number;
    map_name: string;
    clan_id: number;
    clan_name: string;
    amount: number;
};

/** the player boards GET /leaderboards/:type knows */
export type PlayerLeaderboardType =
    | "player_score" | "player_kills" | "player_wins" | "player_timeplayed" | "player_funds" | "player_followed"
    | "player_nukes" | "player_skinvalue" | "player_eventcount" | "player_ranked_matches";

/** one row of a player leaderboard */
export type PlayerLeaderboardRow = {
    position: number;
    player_name: string;
    player_clan: string;
    player_featured: number;
    value: number;
};

/** sort of the clan leaderboard */
export type ClanLeaderboardSort = "score" | "members";

/** one row of GET /leaderboards/player_clan */
export type ClanLeaderboardRow = {
    position: number;
    clan_name: string;
    clan_score: number;
    member_count: number;
    hack_count: number;
};

/** sort of a raid leaderboard */
export type RaidSort = "time" | "completions";

/** GET /leaderboards/raids/:mapId, 100 rows; map 31 is a raid map, 0 is not ("invalid raid map ID") */
export type RaidLeaderboardRow = {
    position: number;
    player_name: string;
    player_clan: string;
    /** milliseconds */
    best_time: number;
    completions: number;
};

/** one row of GET /leaderboards/krunkcup/teams */
export type KrunkCupTeam = {
    id: number;
    total_kills: number;
    total_score: number;
    total_games: number;
};

/** rows of /leaderboards/krunkcup/players and .../teams/:id/contributors */
export type KrunkCupPlayerRow = {
    position: number;
    player_name: string;
    player_clan: string;
    kills: number;
    score: number;
    games: number;
};

/** GET /maps, index = id = preview image number at assets.krunker.io/img/maps/map_<id>.png */
export type OfficialMap = {
    name: string;
    id: number;
};

/** GET /maps/:id, the whole map file (120 KB for Burg), only the keys the client reads are named */
export type MapConfig = {
    name: string;
    modes?: unknown;
    spawns?: unknown[];
    objects?: unknown[];
    sky?: unknown;
    skyDome?: unknown;
} & Record<string, unknown>;

/** one entry of GET /data/skins; the array index is the skin index the market and inventory use.
 * only the keys every entry or the market reads are named, the rest is render config (offsets, shaders, sounds) */
export type GameSkin = {
    /** the texture or model number inside its weapon or slot (weapon_1_107.png), not unique; a string for paints, missing on creator skins */
    id?: number | string;
    name: string;
    rarity: number;
    /** the season it came out in */
    seas: number;
    thumbnail: string;
    tradable: boolean;
    /** weapon index for weapon skins */
    weapon?: number;
    /** the cosmetic slot for the others: "Hat", "Back", "Knife", "Sprays", ... */
    keyW?: string;
    type?: number;
    creator?: string;
    glow?: boolean;
    limited?: boolean;
    /** why it is limited: "Gift", "Twitch", "Charity", ... */
    limT?: string;
    noSale?: boolean | number;
    noSpin?: boolean | number;
    noQuickSell?: boolean | number;
    /** black market items: the kr price and the unlock requirement */
    blackM?: boolean;
    funds?: number;
    req?: string;
    reqT?: string;
} & Record<string, unknown>;

/** one item pool of GET /data/spins */
export type GameSpinPool = {
    name: string;
    color: string;
    /** skin indices */
    items: number[];
};

/** one wheel of GET /data/spins; pools are keys of GameSpins.itemPools, poolWeights their chances in percent.
 * old event wheels have no pools, only `rarities` */
export type GameSpinWheel = {
    name: string;
    pools?: string[];
    poolWeights?: number[];
    price?: number;
    ticketIndex?: number;
    ticketOnly?: boolean;
    multi?: number;
    hide?: boolean;
    locked?: boolean;
    startDate?: string;
    endDate?: string;
} & Record<string, unknown>;

/** GET /data/spins, the raw spin config; /spins/wheels is the shop's view of the same wheels with the pools inlined */
export type GameSpins = {
    itemPools: Record<string, GameSpinPool>;
    wheels: GameSpinWheel[];
};

/** one player title of GET /titles */
export type Title = {
    id: number;
    name: string;
    desc: string;
    rarity: number;
    requirements: { kind: "challenge" | "bundle" | "blackmarket" | string; text: string } | null;
    active: boolean;
};

/** the options object inside a game list entry */
export type GameOptions = {
    /** game version */
    v: string;
    /** gamemode id, see GAMEMODES in the matchmaker module */
    g: number;
    /** custom game */
    c: number;
    cm: number;
    /** map index */
    m: number;
    /** map name */
    i: string;
};

/** [game id, region key, players, max players, options, seconds left] */
export type GameListEntry = [string, string, number, number, GameOptions, number];

/** GET /game-list, every public lobby */
export type GameList = {
    games: GameListEntry[];
    totalPlayerCount: number;
};

/** region key (as in a game entry) -> lobby host:port to ping */
export type PingList = Record<string, string>;

/** one row of the legacy map browser */
export type LegacyMapRow = {
    map_id: number;
    map_name: string;
    map_votes: number;
    creatorname: string;
    map_featured: number;
    /** json text */
    map_info: string;
    map_updatecounter: number;
    map_pl: number;
    fund: number;
    category: string;
    partner: string;
    map_date: string;
};

/** GET api.krunker.io/webhooks/general/maps/list */
export type LegacyMapList = {
    index: string;
    data: LegacyMapRow[];
};

/** one live stream in the menu's stream box */
export type Stream = {
    id: string;
    username: string;
    title: string;
    viewerCount: number;
    thumbnailUrl: string;
    startedAt: string;
    provider: string;
    featured: boolean;
    languageCode: string;
};

/** a running drop campaign */
export type DropCampaign = {
    name: string;
    startDate: number;
    endDate: number;
    drops: { itemId: number }[];
    startDateISO: string;
    endDateISO: string;
};

/** GET api.krunker.io/streams/top */
export type TopStreams = {
    streams: Stream[];
    promo: boolean;
    dropCampaigns: DropCampaign[];
};


/** one row of GET /market/stats: skin index, in circulation, on sale, and the ask range while something is listed */
export type MarketStatRow = {
    ski: number;
    inC: number;
    onS: number;
    high?: number;
    low?: number;
};

/** GET /market/stats, paged by cursor */
export type MarketStats = {
    stats: MarketStatRow[];
    has_more: boolean;
    next_cursor: number | null;
};

/** sort of GET /market/stats; "rarity" is what the market tab sends, an unknown value is answered with the default order */
export type MarketStatsSort = "rarity" | string;

/** filters, sort and cursor of GET /market/stats */
export type MarketStatsQuery = {
    cursor?: number;
    limit?: number;
    sort?: MarketStatsSort;
    rarities?: number[];
    weapons?: number[];
    types?: number[];
    season?: number;
    searchTerm?: string;
};

/** one day of sales of an item: kr, count, date; GET /items/:id/sales and /market/items/:id/sales-statistics */
export type ItemSale = PlayerSale;

/** GET /market/items/:id/sales: the ask range, circulation and the top owners' player ids, despite the path no sales */
export type ItemSalesInfo = {
    /** skin index */
    ind: number;
    /** highest ask, 0 without listings */
    high: number;
    /** lowest ask, 0 without listings */
    low: number;
    /** count in circulation */
    inC: number;
    /** player ids of the top 100 owners, the same 100 the item page lists, never the whole owner base */
    owners: number[];
};

/** one live listing on an item page, the same row the token tier's market/listings feed gives */
export type ItemListing = {
    uid: number;
    marketid: number;
    /** the item instance */
    skinid: number;
    skinindex: number;
    /** ask in kr */
    funds: number;
    seller_id: number;
    seller_name: string;
    /** unix ms */
    listed_time: number;
    /** json text {"wear": 0.9013, "serial": 32}, only on wearable skins */
    m?: string;
};

/** one row of GET /items/:id/instances: the holder's name, the serial and the wear where the skin has one */
export type ItemInstance = {
    nm: string;
    serial: number;
    wear?: number;
};

/** one of an item's top owners, short keys as the game sends them */
export type ItemOwner = {
    /** name */
    nm: string;
    /** count owned */
    ct: number;
    /** staff */
    su: number;
    /** featured (verified) */
    ft: number;
    cr: number;
};

/** GET /items/:id/view, the item page of the social market: the whole order book of the skin, not a page of it */
export type ItemView = {
    stats: { onS: number; high: number; low: number; inC: number };
    /** the top 100 by count owned */
    owners: ItemOwner[];
    /** about the last two weeks, days with a sale */
    sales: ItemSale[];
    /** every live listing of the skin (41 of 42 seen, the one missing had sold between two calls) */
    listings: ItemListing[];
    stackable: boolean;
    wearable: boolean;
};

/** tab of GET /social/feed; only global has been seen */
export type FeedTab = "global" | string;

/** GET /social/post/:id */
export type SocialPost = {
    post: FeedPost;
    comments: unknown[];
};

/** GET /social/news */
export type SocialNews = {
    news: unknown[];
};

/** a running survey of GET /creators/events */
export type CreatorPoll = {
    id: number;
    title: string;
    description: string;
    /** seconds */
    ends_in: number;
};

/** GET /creators/events, the menu's event and survey box */
export type CreatorEvents = {
    events: unknown[];
    polls: CreatorPoll[];
};

/** GET /maps/by-name/:name, the community map record (the official Burg is a different thing, see OfficialMap) */
export type CommunityMap = {
    map_id: number;
    name: string;
    description: string;
    creator_name: string;
    votes: number;
    gameplays: number;
    playtime: number;
    category: number;
    created_at: string;
    updated_at: string;
    leaderboard_type: string;
    leaderboard_order: number;
    featured: boolean;
};

/** GET /maps/by-name/:name/leaderboard */
export type CommunityMapLeaderboard = {
    page: number;
    per_page: number;
    map_name: string;
    leaderboard_type: string;
    leaderboard_order: number;
    entries: unknown[];
};

/** GET /mods/by-name/:name */
export type ModInfo = {
    mod_id: number;
    name: string;
    description: string;
    creator_name: string;
    votes: number;
    featured: boolean;
    version: number;
    created_at: string;
    updated_at: string;
};

/** one price of a shop product, real money or recurring */
export type ShopPrice = {
    id: number;
    price_ref: string;
    type: string;
    real?: { price_usd: number };
    recurring?: { amount: number; periodicity: string };
    available: boolean;
};

/** one product in a shop display */
export type ShopProduct = {
    id: number;
    name: string;
    description: string;
    image_url: string;
    active: boolean;
    prices: ShopPrice[];
    contents: { id: number; type: string; ref: string; quantity: number }[];
    available: boolean;
    display_ids: number[];
};

/** GET /shop/displays, a tree of displays with the products they show */
export type ShopDisplay = {
    id: number;
    type: string;
    order: number;
    data: Record<string, unknown>;
    children: { id: number; parent_id: number; order: number; type: string; data: Record<string, unknown>; product_id?: number }[];
    products: Record<string, ShopProduct>;
};

/** one item pool of a spin wheel */
export type SpinPool = {
    id: string;
    name: string;
    color: string;
    weight: number;
    /** skin indices */
    items: number[];
};

/** GET /spins/wheels, the spin shop's wheels with their pools */
export type SpinWheel = {
    index: number;
    name: string;
    price: number;
    ticketIndex: number;
    ticketOnly: boolean;
    multi: number;
    poolWeights: number[];
    pools: SpinPool[];
} & Record<string, unknown>;

/** GET /lottery/:id, every past draw with its prizes */
export type Lottery = {
    lottery: { id: number; title: string; frequency: number; theme: string };
    player_entries: number;
    total_entries: number;
    previous_draws: ({ id: number; lottery_id: number; starts_at: string; ends_at: string; drawn_at: string; prizes: unknown[] } & Record<string, unknown>)[];
} & Record<string, unknown>;

/** GET api.krunker.io/webhooks/general/items/prices: index = skin index, null = no price */
export type ItemPrices = (number | null)[];

/** one row of the legacy mod browser */
export type LegacyModRow = {
    mod_id: number;
    mod_name: string;
    mod_votes: number;
    creatorname: string;
    mod_featured: number;
    mod_url: string;
    /** json text */
    mod_info: string;
    mod_updatecounter: number;
};

/** GET api.krunker.io/webhooks/general/mods/list */
export type LegacyModList = {
    index: string;
    data: LegacyModRow[];
};
