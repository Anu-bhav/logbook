import resolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import commonjs from "@rollup/plugin-commonjs";
import svelte from "rollup-plugin-svelte";
import babel from "@rollup/plugin-babel";
import { terser } from "rollup-plugin-terser";
import glob from "rollup-plugin-glob";
import config from "sapper/config/rollup.js";
import markdown from "./src/utils/markdown.js";
import pkg from "./package.json";
const dotenv = require('dotenv');
dotenv.config();


const mode = process.env.NODE_ENV;
const dev = mode === "development";
const legacy = !!process.env.SAPPER_LEGACY_BUILD;

const onwarn = (warning, onwarn) =>
    (warning.code === "CIRCULAR_DEPENDENCY" &&
        warning.message.includes("/@sapper/")) ||
    onwarn(warning);

module.exports = {
    client: {
        input: config.client.input(),
        output: config.client.output(),
        plugins: [
            replace({
                preventAssignment: true,
                "process.browser": true,
                "process.env.NODE_ENV": JSON.stringify(mode),
            }),
            svelte({
                dev,
                hydratable: true,
                emitCss: true,
            }),
            resolve(),
            commonjs(),
            markdown(),
            glob(),
            legacy &&
            babel({
                extensions: [".js", ".mjs", ".html", ".svelte"],
                babelHelpers: "runtime",
                exclude: ["node_modules/@babel/**"],
                presets: [
                    [
                        "@babel/preset-env",
                        {
                            targets: "> 0.25%, not dead",
                        },
                    ],
                ],
                plugins: [
                    "@babel/plugin-syntax-dynamic-import",
                    [
                        "@babel/plugin-transform-runtime",
                        {
                            useESModules: true,
                        },
                    ],
                ],
            }),

            !dev &&
            terser({
                module: true,
            }),
        ],
        preserveEntrySignatures: false,
        onwarn,
    },

    server: {
        input: config.server.input(),
        output: config.server.output(),
        plugins: [
            replace({
                preventAssignment: true,
                "process.browser": false,
                "process.env.NODE_ENV": JSON.stringify(mode),
            }),
            svelte({
                generate: "ssr",
                dev,
            }),
            resolve(),
            commonjs(),
            markdown(),
            glob(),
        ],
        external: Object.keys(pkg.dependencies).concat(
            require("module").builtinModules ||
            Object.keys(process.binding("natives"))
        ),

        onwarn,
    },

    serviceworker: {
        input: config.serviceworker.input(),
        output: config.serviceworker.output(),
        plugins: [
            resolve(),
            replace({
                preventAssignment: true,
                "process.browser": true,
                "process.env.NODE_ENV": JSON.stringify(mode),
            }),
            commonjs(),
            !dev && terser(),
        ],

        onwarn,
    },
};
