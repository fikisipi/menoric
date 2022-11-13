import {useEffect} from "react";
import {signup} from "~/api";
import {Form, Link, useActionData} from "@remix-run/react";
// import React from "react"

import {ActionFunction, json, LoaderFunction, redirect} from "@remix-run/node";
import {getSession} from "~/session";
import {CheckIcon, ExclamationTriangleIcon, InformationCircleIcon} from "@heroicons/react/24/outline";
import {ErrorList} from "~/errors";

export const action: ActionFunction = async (a) => {
    let form = await a.request.formData()
    let S = await getSession(a.request)

    if(form.has("logout")) {
        S.unset("token")
        return redirect("/", await S.headerCommit())
    }

    let username = form.get("sgn-nm") as string
    let password = form.get("sgn-pw") as string
    let email = form.get("sgn-ml") as string
    let res = await signup({username, password, email})

    if(res.errors) {
        return json({errors: res.errors})
    } else {
        S.flash("success", "Successfully signed up")
        return redirect("/login", {headers: {"Set-Cookie": await S.commit()}})
    }
}

export const loader: LoaderFunction = async (a) => {
    let S = await getSession(a.request)
    if(S.user) {
        return redirect("/home")
    }
    return json(null)
}

export default function Index() {
    let act = useActionData<{errors?: {message: string}[]}>()
    let errs = <></>
    if(act?.errors) {
        errs = <ErrorList errors={act.errors} />
    }
  return (
      <div className={"text-white bg-[#121212] h-[100vh]"}>
          <div className={"container mx-auto font-sans font-bold text-3xl py-10"}>
              Welcome to <span className={"text-[#FECC29]"}>menoric</span>: the microblogging platform.
              <br/><br/>
              <div className={"flex justify-center text-lg gap-2 items-center"}>Have an account? <Link to={"login"} className={"rounded-full border-[4px] border-t-[#FECC2880] border-l-[#FECC2880] font-bold border-[#FECC28] text-sm px-4 py-2"}>Login</Link>
              </div>
              <Form className={"w-full py-10 max-w-[500px] mx-auto block text-base"} method={"post"}>
                  {errs}
                  <input name={"sgn-nm"} className={"!text-base bg-transparent p-2 w-full text-white outline-0 my-2 shadow-xl border-b-2 !border-[#FECC28]"} placeholder={"Username"} />
                  <span className={"text-xs font-normal text-slate-300 py-1 flex items-center"}>
                      <InformationCircleIcon className={"w-4 h-4 mr-2"} />
                      your username will be used for @mentions
                  </span>
                  <input name="sgn-ml" className={"!text-base bg-transparent p-2 border-white w-full outline-0 text-white my-2 shadow-xl border-b-2 !border-[#FECC28]"} placeholder={"Email"} />
                  <span className={"text-xs font-normal text-slate-300 py-1 flex items-center"}>
                      <InformationCircleIcon className={"w-4 h-4 mr-2"} />
                      to prevent bots, you can only use: gmail, outlook, hotmail, yahoo, icloud.com
                  </span>
                  <input type="password" name="sgn-pw" className={"!text-base bg-transparent p-2 border-white w-full outline-0 text-white my-2 shadow-xl border-b-2 !border-[#FECC28]"} placeholder={"Password"} />
                  <span className={"text-xs font-normal text-slate-300 py-1 flex items-center"}>
                      <InformationCircleIcon className={"w-4 h-4 mr-2"} />
                      minimum password length: 5 characters
                  </span>
                  <br/><br/>
                  <CheckIcon className={"w-4 h-4 inline-block"}/> By signing up you agree to the Terms & Conditions. <br/>
                  <button type={"submit"} className={"rounded-full border-[4px] border-t-[#FECC2880] border-l-[#FECC2880] font-bold border-[#FECC28] text-sm px-4 py-2 mt-10"}>Sign up</button>
              </Form>
          </div>
      </div>
  );
}
