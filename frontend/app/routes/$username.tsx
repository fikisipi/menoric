import {ActionFunction, json, LoaderFunction, redirect} from "@remix-run/node";
import {Form, useLoaderData} from "@remix-run/react";
import {follow, getUser, unfollow, User} from "../../api";
import {Timeline} from "~/routes/home";
import {getSession} from "~/session";

export const loader: LoaderFunction = async (a) => {
    let username = a.params.username || "";
    let U = await getUser({username})
    let S = await getSession(a.request)
    if(U.errors) {
        return redirect("/")
    }
    return json({user: U.data, self: S.user || null})
}

export const action: ActionFunction = async (a) => {
    let f = await a.request.formData()
    let S = await getSession(a.request)
    let followId = f.get("followId") as string
    let action = f.get("action") as "Follow" | "Following"
    if(followId != S.user?.id) {
        if (action === "Follow") {
            await follow({token: S.token, to: followId})
        } else {
            await unfollow({token: S.token, to: followId})
        }
    }
    return json(null)
}

export default function A() {
    let data: {user: User, self: User | null} = useLoaderData()
    let followAction = "Login to follow"
    if(data.self) {
        followAction = "Follow"

        if (data.user.id === data.self?.id) {
            followAction = "Following"
        }
        if(data.self.following!.find(x => x.id == data.user.id)) {
            followAction = "Following"
        }
    }
    if(data)
        return <div>
            <div className={"mx-auto container max-w-[800px]"}>
                <div className={"flex gap-4 items-center mb-8 mt-4"}>
                    <div className={"w-[60px] h-[60px] rounded-full bg-neutral-700"} />
                    <div>
                        <strong className={"font-semibold"}>@{data.user.username}</strong> <br/>
                        {data.user.bio || "No bio"}
                    </div>
                    <div>
                        <Form method={"post"}>
                            <input type={"hidden"} name={"followId"} value={data.user.id} />
                            <input type={"hidden"} name={"action"} value={followAction} />
                            <button type={"submit"} className={"rounded-full border-[4px] border-t-[#FECC2880] border-l-[#FECC2880] font-bold border-[#FECC28] text-sm px-4 py-2"}>{followAction}</button>
                        </Form>
                    </div>
                    <div>
                        <h3>{data.user.followers?.length}</h3>
                        followers
                    </div>
                    <div>
                        <h3>{data.user.following?.length}</h3>
                        following
                    </div>
                </div>

                <Timeline messages={data.user.messages!} />
            </div>
        </div>
}