import {Form, useActionData, useLoaderData, useFetchers} from "@remix-run/react";
import {ActionFunction, json, redirect} from "@remix-run/node";
import {login} from "../../api";
import {getSession} from "~/session";
import {ErrorList} from "~/errors";

export const action: ActionFunction = async (a) => {
    let f = await a.request.formData()
    let u = f.get("username") as string
    let pw = f.get("password") as string

    let S = await getSession(a.request)
    let Q = await login({username: u, password: pw})
    if(Q.errors) {
        return json({errors: Q.errors})
    } else {
        S.set("token", Q.data.token)
        return redirect("/", await S.headerCommit())
    }
}

export default function() {
    let data = useActionData<{errors?: any[]}>()
    let errs = <ErrorList errors={data && data.errors ? data.errors : []} />
    return <>
    <div className={"container mx-auto"}>
        <Form className={"w-full py-10 max-w-[500px] mx-auto block"} method={"post"}>
            {errs}
            <input name={"username"} className={"bg-transparent p-2 w-full text-white outline-0 my-2 shadow-xl border-b-2 !border-[#FECC28]"} placeholder={"Username"} />
            <input name="password" type={"password"} className={"bg-transparent p-2 border-white w-full outline-0 text-white my-2 shadow-xl border-b-2 !border-[#FECC28]"} placeholder={"Password"} />
            <button type={"submit"} className={"rounded-full border-[4px] border-t-[#FECC2880] border-l-[#FECC2880] font-bold border-[#FECC28] text-sm px-4 py-2 mt-10"}>Login</button>
        </Form>
    </div>

    </>
}