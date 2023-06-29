const { Telegraf } = require("telegraf");
require("dotenv/config");
const { Octokit, App } = require("octokit");
const axios = require("axios");
const express = require("express");
const https = require("https");
const fs = require("fs");
const path = require("path");



const bot = new Telegraf(process.env.BOT_TOKEN);

const url = "https://github.com";

const app = express();

var owner = "";
var repo = "";

bot.start((ctx) =>
    ctx.reply("Welcome! Please Send me a Github Repo URL to Start 👋")
);

bot.help((ctx) =>
    ctx.reply(
        "Please Send me a Github Repo URL like(https://github.com/owner/repo) to Start or use @githubrepo_download_bot to search for repositories"
    )
);


bot.on("text", (ctx) => {
    const input = ctx.message.text;
    if (input === "hey")
        ctx.reply("Please I am not a chat bot, please send a github repo URL");
    else {
        try {
            const URLcheck = new URL(input);

            const paths = URLcheck.pathname.toString().split("/");
            owner = paths[1];
            repo = paths[2];

            console.log(repo);

            if (URLcheck.origin !== url) {
                ctx.reply("hmm..Seems like You sent a non-github URL 🤔");
            } else {
                try {
                    const octokit = new Octokit({
                        auth: process.env.AUTH,
                    });

                    ctx.reply("Fetching Files ⏱️");
                    octokit
                        .request("GET /repos/{owner}/{repo}/zipball/{ref}", {
                            owner: owner,
                            repo: repo,
                            ref: "",
                        })
                        .then((response) => {
                            try {
                                const file = fs.createWriteStream(
                                    path.join(
                                        __dirname,
                                        `./downloads/file${ctx.chat.id}.zip`
                                    )
                                );

                                const request = https.get(
                                    response.url,
                                    function (res) {
                                        res.pipe(file);

                                        file.on("finish", () => {
                                            file.close();

                                            let filePath = path.join(
                                                __dirname,
                                                `./downloads/file${ctx.chat.id}.zip`
                                            );
                                            fs.readFile(
                                                filePath,
                                                (err, data) => {
                                                    if (!err) {
                                                        try {
                                                            ctx.telegram
                                                                .sendDocument(
                                                                    ctx.chat.id,
                                                                    {
                                                                        source: data,
                                                                        filename: `${owner}-${repo}.zip`,
                                                                    }
                                                                )
                                                                .then((res) => {
                                                                    console.log(
                                                                        res
                                                                    );
                                                                })
                                                                .catch((e) => {
                                                                    ctx.reply(
                                                                        "Repo Size too Big:("
                                                                    );
                                                                });
                                                        } catch (e) {
                                                            ctx.reply(
                                                                "Repo Size too Big:("
                                                            );
                                                        }

                                                        fs.unlink(
                                                            filePath,
                                                            () => {
                                                                let newUser = {
                                                                    Name: ctx.chat.id.toString(),
                                                                };
                                                                axios
                                                                    .post(
                                                                        process
                                                                            .env
                                                                            .DB_URL,
                                                                        newUser
                                                                    )
                                                                    .catch(
                                                                        (e) =>
                                                                            console.log(
                                                                                ""
                                                                            )
                                                                    );
                                                                ctx.reply(
                                                                    "Successfully Completed 👍"
                                                                );
                                                            }
                                                        );
                                                    } else {
                                                        ctx.reply(
                                                            "Download Error! Please try Again ⚠️"
                                                        );
                                                    }
                                                }
                                            );
                                        }).on("error", (e) => {
                                            fs.unlink(filePath, () => {
                                                console.log("deleted");
                                            });
                                            ctx.reply(
                                                "Download Error! Please try Again ⚠️"
                                            );
                                        });
                                    }
                                );
                            } catch (e) {
                                console.log("error here 3");
                                console.log(e);
                                ctx.reply("Repo Size too Big:(");
                            }
                        })
                        .catch((e) => {
                            console.log("error here 4");
                            console.log(e);

                            ctx.reply("Repo Not Found!");
                        });
                } catch (e) {
                    console.log(e.data?.message);
                }
            }
        } catch (e) {
            ctx.reply("hmm..Seems like You Didn't send a URL 🤔");
        }
    }
});

const Port = process.env.PORT || 3001;

bot.launch();

app.post(`/${process.env.BOT_TOKEN}`, (req, res) => {
    bot.handleUpdate(req.body);
});

app.get("/", (req, res) => {
    res.send("Server is Live");
});

app.listen(Port, () => {
    console.log("Server Started");
});
