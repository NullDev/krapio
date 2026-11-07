import { describe, expect, test } from "bun:test";
import {
    GAPI_URL,
    Krunker,
    KrunkerArgumentError,
    KrunkerConfigError,
    KrunkerDeveloperApi,
    KrunkerError,
    KrunkerGameApi,
    KrunkerTokenApi,
    KrunkerTokenError,
    LEGACY_API_URL,
    MATCHMAKER_URL,
    RAID_MAPS,
    Region,
    TokenSession,
    turfDay,
} from "../src/index.js";
import { type Call, envelope, fakeFetch, jwt, liveClaims, ok } from "./fake.js";

const caught = async(run: () => Promise<unknown>): Promise<unknown> => {
    try {
        await run();
        return null;
    }
    catch (err){
        return err;
    }
};

/** answers every url with an envelope, the legacy api with a bare body */
const anything = (call: Call): ReturnType<typeof ok> => {
    if (call.url.startsWith(LEGACY_API_URL)) return ok({ data: { leaderboard: [], totalPages: 1 } });
    if (call.url.startsWith(MATCHMAKER_URL)) return ok([]);
    if (call.url.includes("/api/")) return ok({ player_name: "x" });
    return envelope({ stats: [] });
};

describe("Krunker", () => {
    test("the developer api sits on the root and sends the key", async() => {
        const fake = fakeFetch(anything);
        const krunker = new Krunker({ apiKey: "k", userAgent: "t/1", fetch: fake.fetch });
        expect(krunker).toBeInstanceOf(KrunkerDeveloperApi);
        expect(krunker.configured).toBe(true);
        await krunker.player.profile("Nul Ping");
        await krunker.leaderboard.ranked(Region.EUROPE, { page: 2, season: 15 });
        await krunker.match.get(12345678901234567890n);
        await krunker.market.skin(1234, { days: 7 });
        expect(fake.calls.map((c) => c.url)).toEqual([
            `${GAPI_URL}/api/player/Nul%20Ping`,
            `${GAPI_URL}/api/leaderboard/3?page=2&season=15`,
            `${GAPI_URL}/api/match/12345678901234567890`,
            `${GAPI_URL}/api/market/skin/1234?days=7`,
        ]);
        for (const call of fake.calls) expect(call.headers["X-Developer-API-Key"]).toBe("k");
        expect(fake.calls[0]!.headers["User-Agent"]).toBe("t/1");
    });

    test("events and kpd calls build their urls and refuse bad filters locally", async() => {
        const fake = fakeFetch(() => ok({ events: [], next: 0, has_more: false }));
        const krunker = new Krunker({ apiKey: "k", fetch: fake.fetch });
        await krunker.events.list();
        await krunker.events.list({ after: 1042, types: ["map.featured", "map.unfeatured"], target_type: "map", target_id: [8497, "8500"], limit: 50 });
        await krunker.kpd.latestCalls();
        expect(fake.calls.map((c) => c.url)).toEqual([
            `${GAPI_URL}/api/events`,
            `${GAPI_URL}/api/events?after=1042&types=map.featured%2Cmap.unfeatured&target_type=map&target_id=8497%2C8500&limit=50`,
            `${GAPI_URL}/api/kpd/latest-calls`,
        ]);
        expect(await caught(() => krunker.events.list({ target_id: [1] }))).toBeInstanceOf(KrunkerArgumentError);
        expect(await caught(() => krunker.events.list({ limit: 101 }))).toBeInstanceOf(KrunkerArgumentError);
        expect(await caught(() => krunker.events.list({ after: -1 }))).toBeInstanceOf(KrunkerArgumentError);
        expect(await caught(() => krunker.events.list({ target_type: "map", target_id: Array.from({ length: 101 }, (_, i) => i) }))).toBeInstanceOf(KrunkerArgumentError);
        expect(fake.calls).toHaveLength(3);
    });

    test("without a key the root throws before a request and the game tier still works", async() => {
        const fake = fakeFetch(anything);
        const krunker = new Krunker({ fetch: fake.fetch });
        expect(krunker.configured).toBe(false);
        expect(await caught(() => krunker.player.profile("x"))).toBeInstanceOf(KrunkerConfigError);
        expect(fake.calls).toHaveLength(0);
        expect(await krunker.game.market.stats({ sort: "rarity", rarities: [5, 6] })).toMatchObject({ stats: [] });
        expect(fake.calls[0]!.url).toBe(`${GAPI_URL}/market/stats?sort=rarity&rarities=5%2C6`);
        expect(fake.calls[0]!.headers["X-Developer-API-Key"]).toBeUndefined();
    });

    test("the game tier unwraps the envelope and surfaces its error", async() => {
        const errored = fakeFetch([ok({ data: null, error: { code: "SOCIAL_INVALID_TAB", message: "bad tab" } })]);
        const err = await caught(() => new KrunkerGameApi({ fetch: errored.fetch }).social.feed());
        expect(err).toBeInstanceOf(KrunkerError);
        expect((err as Error).message).toContain("bad tab");
    });

    test("game resources go to the three hosts", async() => {
        const fake = fakeFetch(anything);
        const game = new KrunkerGameApi({ fetch: fake.fetch });
        await game.matchmaker.gameList();
        await game.legacy.itemPrices();
        await game.turf.status();
        expect(fake.calls[0]!.url.startsWith(MATCHMAKER_URL)).toBe(true);
        expect(fake.calls[1]!.url.startsWith(LEGACY_API_URL)).toBe(true);
        expect(fake.calls[2]!.url.startsWith(GAPI_URL)).toBe(true);
    });

    test("the /data files are jsonpack text, decoded", async() => {
        const fake = fakeFetch([
            ok("id|name|Arctic+Hunt^0^^@$0|3|1|2]]", { "Content-Type": "text/plain" }),
            ok("itemPools|wheels^^^$0|$]|1|@]]", { "Content-Type": "text/plain" }),
        ]);
        const game = new KrunkerGameApi({ fetch: fake.fetch });
        expect(await game.game.skins() as unknown[]).toEqual([{ id: 0, name: "Arctic Hunt" }]);
        expect(await game.game.spins()).toEqual({ itemPools: {}, wheels: [] });
        expect(fake.calls.map((c) => c.url)).toEqual([`${GAPI_URL}/data/skins`, `${GAPI_URL}/data/spins`]);
    });

    test("bad arguments never cost a request", async() => {
        const fake = fakeFetch(anything);
        const krunker = new Krunker({ apiKey: "k", fetch: fake.fetch });
        expect(await caught(() => krunker.player.profile(""))).toBeInstanceOf(KrunkerArgumentError);
        expect(await caught(() => krunker.game.leaderboards.raidsMonthly(RAID_MAPS[0]!, "8"))).toBeInstanceOf(KrunkerArgumentError);
        expect(await caught(() => krunker.game.social.feed("global", 0))).toBeInstanceOf(KrunkerArgumentError);
        expect(fake.calls).toHaveLength(0);
    });

    test("as(token) binds every call to the bearer and api.krunker.io for ranked", async() => {
        const fake = fakeFetch(anything);
        const krunker = new Krunker({ fetch: fake.fetch });
        const token = jwt(liveClaims({ sub: "frvr-42" }));
        const me = krunker.as(token);
        expect(me).toBeInstanceOf(TokenSession);
        expect(me.claims.sub).toBe("frvr-42");
        await me.player.wallet();
        await me.ranked.leaderboard(15, { limit: 3, region: 3 });
        expect(fake.calls[0]!.url).toBe(`${GAPI_URL}/player/wallet`);
        expect(fake.calls[0]!.headers.Authorization).toBe(`Bearer ${token}`);
        expect(fake.calls[1]!.url).toBe(`${LEGACY_API_URL}/leaderboards/rankings/season/15/region/3?limit=3&offset=0`);
        expect(fake.calls[1]!.headers.Authorization).toBe(`Bearer ${token}`);
        expect(fake.calls[1]!.headers["X-Developer-API-Key"]).toBeUndefined();
    });

    test("a dead token is refused before a request", () => {
        const fake = fakeFetch(anything);
        expect(() => new Krunker({ fetch: fake.fetch }).as("nope")).toThrow(KrunkerTokenError);
        expect(() => new KrunkerTokenApi({ fetch: fake.fetch }).as(jwt({ sub: "x", exp: 1 }))).toThrow(/expired/);
        expect(fake.calls).toHaveLength(0);
    });

    test("helpers are exported", () => {
        expect(RAID_MAPS).toContain(18);
        expect(turfDay(new Date(Date.UTC(2026, 2, 18)))).toBe(1);
    });
});
