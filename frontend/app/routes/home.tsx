import {Form, Link, useActionData, useLoaderData} from "@remix-run/react";
import {ActionFunction, json, LoaderFunction, redirect} from "@remix-run/node";
import {getSession} from "~/session";
import {getTimeline, Message, newMessage} from "../../api";
import {fromNow} from "~/errors";

export const action: ActionFunction = async (a) => {
    let S = await getSession(a.request)
    if(!S.user) {
        return redirect("/")
    }
    let f = await a.request.formData()
    let msg = f.get("message") as string
    let resp = await newMessage({token: S.token, message: msg})
    if(!resp.errors) {
        S.flash("success", "Sent message")
        return json(resp, await S.headerCommit())
    }
    return json(resp)
}
export const loader: LoaderFunction = async (a) => {
    let S = await getSession(a.request)
    if(!S.user) {
        return redirect("/")
    }
    let t = await getTimeline({userId: S.user.id})
    return json(t)
}

function NewMsg() {
    return <Form className={"my-2"} method={"post"}>
        <textarea name="message" className={"w-full h-[100px] bg-[#171717] text-white font-regular p-4 border-neutral-800 rounded-lg border-[1px]"} placeholder={"Enter message"}/>
        <button type={"submit"} className={"rounded-full border-[4px] border-t-[#FECC2880] border-l-[#FECC2880] font-bold border-[#FECC28] text-sm px-4 py-2"}>Send</button>
    </Form>
}

export function Timeline(props: {messages: Message[]}) {
    return <>{props.messages.map(x => {
        return <div key={x.id} className={"flex gap-2 py-3 border-b-[1px] border-neutral-700 "}>
            <div className={"w-[42px]"}>
                <div className={"w-[42px] h-[42px] rounded-full bg-neutral-500"} />
            </div>
            <div className={"grow-1"}>
                <div className={"font-semibold"}><Link to={"/" + x.user.username}>{x.user.username}</Link> <span className={"text-neutral-400"}>{fromNow(x.time)}</span></div>
                {x.message}
            </div>
        </div>
    })}</>
}

export default function() {
    let dt = useLoaderData<{data: Message[]}>();

    return <div>
        <div className={"container mx-auto max-w-[800px]"}>
            <NewMsg />
            <br/><br/>
            <Timeline messages={dt.data} />
        </div>
    </div>
}