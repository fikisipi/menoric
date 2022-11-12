import { serveTailwindCss } from "remix-tailwind"
import {LoaderFunction} from "@remix-run/node";

export const loader: LoaderFunction = () => serveTailwindCss()