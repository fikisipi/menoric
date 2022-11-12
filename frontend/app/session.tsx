import {createCookieSessionStorage} from "@remix-run/node";
import {loginToken, User} from "../api"
const { getSession: G, commitSession, destroySession } =
    createCookieSessionStorage({
        // a Cookie from `createCookie` or the same CookieOptions to create one
        cookie: {
            name: "__session",
            secrets: ["adsfx35"],
            sameSite: "lax",
        },
    });

export async function getSession(request: Request) {
    const S = await G(request.headers.get("Cookie"))
    let user: User | undefined = undefined;

    if(S.has("token")) {
        let res = await loginToken({token: S.get("token")})
        if(res.errors) {
            S.unset("token")
        } else {
            user = res.data.user
        }
    }

    return {
        session: S,
        set: S.set,
        unset: S.unset,
        flash: S.flash,
        get: S.get,
        has: S.has,
        user,
        token: S.get("token"),
        headerCommit: async () => ({headers: {"set-cookie": await commitSession(S)}}),
        commit: async () => await commitSession(S)
    }
}