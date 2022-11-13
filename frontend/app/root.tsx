import type {MetaFunction, LinksFunction, LoaderFunction} from "@remix-run/node";
import {
  Form, Link,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration, useFetchers, useLoaderData, useTransition,
} from "@remix-run/react";
import {getSession} from "~/session";
import {json} from "@remix-run/node";
import Modal from "@mui/material/Modal";
import Snackbar from "@mui/material/Snackbar"
import Alert from "@mui/material/Alert"
import CircularProgress from "@mui/material/CircularProgress"
import {ArrowLeftOnRectangleIcon} from "@heroicons/react/20/solid";
import rootStyle from "../styles/root.out.css"
import muiStyle from "../styles/mui.css"

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "menoric",
  viewport: "width=device-width,initial-scale=1",
});

export const loader: LoaderFunction = async (a) => {
  let S = await getSession(a.request)
  let extra: Record<string, any> = {}
  if(S.has("success")) {
    extra['success'] = S.get("success")
  }
  if(S.user) {
    extra['username'] = S.user.username
    extra['token'] = S.token
  }
  return json({...extra}, {headers: {'set-cookie': await S.commit()}})
}

export const links: LinksFunction = () => {
  // return []
  return [{ rel: "stylesheet", href: rootStyle }, {rel: "stylesheet", href: muiStyle}, {rel:"stylesheet", href: "https://rsms.me/inter/inter.css"}]
}

export default function App() {
  let T = useTransition()
  let d = useLoaderData<{username?: string, success?: string}>()

  let loader = <></>
  if(T.state != "idle") {
    loader = <Modal open={true} className={"flex items-center justify-center"}>
      <div className={"flex p-10"}>
        <CircularProgress />
      </div>
    </Modal>
  }
  let success = <></>
  if(d.success) {
    success =       <Snackbar open={true} autoHideDuration={2000} anchorOrigin={{vertical: "top", horizontal: "center"}} onClose={()=>0}>
      <Alert severity="success" sx={{ width: '100%' }}>
        {d.success}
      </Alert>
    </Snackbar>
  }

  let D = useLoaderData<{username: string, token: string}>()
  return (
      <html lang="en">
      <head>
        <Meta />
        <Links />
        <style>{`:root{color-scheme: dark; } body{color: #fff; background: #121212; } body,.font-sans{font-family: Inter,ui-sans-serif,Arial;}`}</style>
      </head>
      <body>
      <div className={"sticky top-0 w-full border-b-2 py-2 border-[#333]"}>
        <div className={"container flex justify-between mx-auto font-medium items-center"}>
          <div>
            <Link className={"font-bold text-[#FECC29] tracking-wide"} to={"/"}>menoric</Link>
          </div>
          <div className={"text-sm flex items-center"}>
            {d.username || ""}
            <Form className={"inline-block px-2 " + (!d.username ? "hidden" : "") }  action={"/?index"} method={"post"}>
              <input type={"hidden"} name={"logout"} value={"true"} />
              <button type="submit" className={"border-2 text-neutral-500 flex items-center border-neutral-700 font-normal text-sm rounded-full px-2 py-1"}>
                <ArrowLeftOnRectangleIcon className={"mr-2 w-4 h-4"} />
                sign out
              </button>
            </Form>
          </div>
        </div>

      </div>
      {success}
      {loader}
      <Outlet />
      <ScrollRestoration />
      <Scripts />
      <LiveReload />
      </body>
      </html>
  );
}
