// ========================= //
// = Copyright (c) NullDev = //
// =     - SPDX: MIT -     = //
// ========================= //

// shapes of the endpoints that need a player's frvr token, from live replies and the game code; "me" endpoints describe the token's player

/** GET /player/me, data is the packed account blob the game decodes itself */
export type MePlayer = {
    player: { id: string; name: string; data: unknown[] };
};

/** one currency in the wallet, kr or a studio currency */
export type WalletCurrency = {
    id: number;
    name: string;
    symbol: string;
    amount: number;
};

/** GET /player/wallet, kr plus every studio currency */
export type Wallet = {
    currencies: WalletCurrency[];
    spending_tier: number;
};

/** GET /guest/profile, zeros without a guest token */
export type GuestProfile = {
    profile: { score: number; funds: number; kills: number; deaths: number; games: number; wins: number };
};

/** GET /account/usernames */
export type Usernames = {
    active: string;
    names: { name: string; state: string; leave_release_secs: number }[];
    cooldown_secs: number;
};

/** GET /email/preferences */
export type EmailPreferences = {
    chosen: boolean;
    promotional: boolean;
};

/** GET /discord/status, the optional fields only while linked */
export type DiscordStatus = {
    configured: boolean;
    linked: boolean;
    id?: string;
    username?: string;
    globalName?: string;
    avatar?: string;
    linkedAt?: number;
    guildUrl?: string;
    inGuild?: boolean;
};

/** GET /ranked/shop, the skins bought with ranked currency */
export type RankedShop = {
    skins: { id: number; skin_id: number; price: number; max_purchase: number; purchase_count: number }[];
};

/** a reply that carries its refusal inside data (wild offer: "Wild offer is not available") */
export type SoftError = { error: string };

/** GET /shop/wild-offer, a SoftError when there is none */
export type WildOffer = SoftError | Record<string, unknown>;

/** a custom skin of the token's player (the skin editor) */
export type CustomSkin = {
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

/** GET /skins, the player's custom skins paged */
export type CustomSkinsPage = {
    skins: CustomSkin[];
    total: number;
    page: number;
    pageSize: number;
};

/** page, page size and filters of the player's custom skins */
export type CustomSkinsQuery = {
    page?: number;
    page_size?: number;
    type?: number;
    weapon?: number;
    search?: string;
};

/** GET /clans/my-applications, null without any */
export type MyApplications = {
    clan_ids: number[] | null;
};

/** one active listing on the live market */
export type LiveListing = {
    uid: number;
    marketid: number;
    /** the item instance */
    skinid: number;
    skinindex: number;
    /** asking price in kr */
    funds: number;
    seller_id: number;
    seller_name: string;
    /** unix ms */
    listed_time: number;
    /** how many of this skin the seller has listed */
    listing_count: number;
};

/** GET /market/listings */
export type MarketListings = {
    listings: LiveListing[];
    has_more: boolean;
    /** the cursor_id of the next page */
    next_cursor_id: number | null;
} & Record<string, unknown>;

/** sort of the live market listings */
export type MarketListingsSort = "latest" | "price_asc" | "price_desc" | "popular";

/** filters, sort and cursor of GET /market/listings */
export type MarketListingsQuery = {
    item_id?: number;
    items?: number[];
    sort?: MarketListingsSort;
    cursor_id?: number;
    limit?: number;
    rarities?: number[];
    weapons?: number[];
    types?: number[];
    wears?: number[];
    season?: number;
    painted?: boolean;
    searchTerm?: string;
};

/** one inventory stack: skin index, count, instance id, state */
export type InventoryStack = {
    i: number;
    cnt: number;
    sid: number;
    st: number;
};

/** sort of the player's market history */
export type MarketHistorySort = "date_asc" | "date_desc" | "amount_asc" | "amount_desc" | "item_asc" | "item_desc";

/** one completed buy or sell of the player */
export type MarketHistoryEntry = {
    marketid: number;
    type: "sell" | "buy" | string;
    date: string;
    skinindex: number;
    amount: number;
    other_party_id: number;
    other_party_name: string;
    status: string;
};

/** GET /market/history */
export type MarketHistory = {
    history: MarketHistoryEntry[];
    has_more: boolean;
    /** the cursor of the next page */
    next_cursor: number | null;
} & Record<string, unknown>;

/** GET /market/sales, one of the player's own open listings */
export type OpenListing = {
    uid: number;
    marketid: number;
    /** the item instance */
    skinid: number;
    skinindex: number;
    /** asking price in kr */
    funds: number;
    /** unix ms */
    listed_time: number;
};

/** sort, cursor and limit of GET /market/history */
export type MarketHistoryQuery = {
    sort?: MarketHistorySort;
    cursor?: number;
    limit?: number;
};

/** GET /market/black-market, the skin indices on offer */
export type BlackMarket = number[];

/** GET /market/black-market/rank, null without a ranked history */
export type BlackMarketRank = {
    peak_mmr: number | null;
};

/** one item in a trade, by skin index */
export type TradeItem = { ind: number } & Record<string, unknown>;
/** one currency amount in a trade */
export type TradeCurrency = { cid: number; amt: number };

/** one trade, short keys as the game sends them */
export type Trade = {
    trid: number;
    /** items offered */
    sksell: TradeItem[];
    /** items asked for */
    skbuy: TradeItem[];
    csell: TradeCurrency[];
    cbuy: TradeCurrency[];
    /** id of the player who made the offer, their items are sksell */
    pl: number;
    /** id of the player the offer went to, their items are skbuy */
    buy: number;
    /** name of the player the offer went to */
    buyer: string;
    /** name of the player who made the offer */
    player: string;
    message: string;
    /** when the offer was made, "YYYY-MM-DD HH:MM:SS" utc; a completed trade keeps it */
    dte: string;
};

/** GET /trades/history */
export type TradeHistory = {
    open: Trade[];
    completed: Trade[];
    completed_has_more?: boolean;
};

/** the body the game posts to /market/list; krapio never sends it */
export type MarketListRequest = { item_id: number; price: number; skin_id: number };
/** the reply to POST /market/list: the kr left, the stack left of that skin, the new listing's market id */
export type MarketListResult = { funds: number; cnt: number; marketid: number };
/** the body the game posts to /market/unlist */
export type MarketUnlistRequest = { market_id: number };
/** the reply to POST /market/unlist */
export type MarketUnlistResult = { response: "SUCCESS" | string };
/** the body the game posts to /market/purchase */
export type MarketPurchaseRequest = { market_id: number };
/** the reply to POST /market/purchase: the kr left, the bought instance, the listing's market id and skin index */
export type MarketPurchaseResult = { playerfunds: number; sid: number; mid: number; skn: number };
/** the body the game posts to /trades/create */
export type TradeCreateRequest = { target_player_id: number; my_offer: { i: number; c: number }[]; their_offer: { i: number; c: number }[]; message: string };
/** the reply to POST /trades/create and POST /trades/:id/accept: the kr left */
export type TradeFundsResult = { funds: number };
/** the reply to POST /trades/:id/cancel */
export type TradeCancelResult = { success: boolean };

/** offset, limit and whether open trades are included */
export type TradeHistoryQuery = {
    offset?: number;
    limit?: number;
    includeOpen?: boolean;
};

/** GET /trades/inventory/:playerId, both sides */
export type TradeInventories = {
    my_inventory: InventoryStack[];
    their_inventory: InventoryStack[];
};

/** GET /trades/player-search, one player by exact name */
export type TradePlayer = {
    player_id: number;
    player_name: string;
    player_score: number;
};

/** GET /krunkcup/wristband */
export type Wristband = {
    skin_index: number;
    claimed: boolean;
    style: number;
    instance_id: number;
};

/** offset and search of the kpd demo queue */
export type KpdDemosQuery = {
    off?: number;
    q?: string;
};

/** a player's ranked card in the season rankings */
export type RankedProfileEntry = {
    player_name: string;
    conservative_rating: number;
    total_matches: number;
    rank: number;
};

/** GET api.krunker.io/leaderboards/rankings/season/:season[/region/:region] */
export type SeasonRankings = {
    leaderboard: { position: number; profile: RankedProfileEntry }[];
    totalPages: number;
};

/** limit, offset and region of the season rankings */
export type SeasonRankingsQuery = {
    limit?: number;
    offset?: number;
    region?: number;
};

/** GET api.krunker.io/player-profile/me/season/:season[/region/:region], the only place with a season accuracy total */
export type RankedProfile = {
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

/** GET api.krunker.io/match-history/me/..., paged */
export type RankedMatchHistory = {
    matchHistory: { matches: unknown[]; totalPages: number };
};

/** limit, offset, mode, ranked flag and region of the ranked match history */
export type RankedMatchHistoryQuery = {
    limit?: number;
    offset?: number;
    gameMode?: number;
    /** undefined = all */
    isRanked?: boolean;
    region?: number;
};

/** GET api.krunker.io/ranked/me/connection */
export type RankedConnection = {
    serverUrl: string | null;
};

/** GET api.krunker.io/daily-spin/progress */
export type DailySpinProgress = {
    score: number;
    maxScore: number;
    stage: number;
    /** seconds */
    timeRemaining: number;
    claimed: boolean;
};
