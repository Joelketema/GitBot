import { Telegraf } from 'telegraf'
import env from "dotenv/config"
import { Octokit, App } from "octokit";
import https from 'https'; 
import fs from 'fs';
import path from "path"

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const bot = new Telegraf(process.env.BOT_TOKEN) 
const url = "https://github.com";


  
var owner = "";
var repo = "";

bot.start((ctx) => ctx.reply('Welcome! Please Send me a Github Repo to Start'))

bot.help((ctx) => ctx.reply('Please Send me a Github Repo to Start'))

bot.on('text',  (ctx) => {
    const input = ctx.message.text;

    try {
        const URLcheck = new URL(input)

        const paths = URLcheck.pathname.toString().split("/")
        owner = paths[1]
        repo = paths[2]

        if(URLcheck.origin !== url)
        {
            ctx.reply("hmm..Seems like You sent a non-github URL");
        }
        else
        {
            const octokit = new Octokit({
                auth: process.env.AUTH
            })
          

            try {      
                ctx.reply("Getting file....")
                octokit.request('GET /repos/{owner}/{repo}/zipball/{ref}', {
                    owner: owner,
                    repo: repo,
                    ref: ''
                }).then(response => {
                    
                    try {
                        
                        const file = fs.createWriteStream(`./downloads/file${ctx.chat.id}.zip`);

                        const request = https.get(response.url, function(res) {
                            res.pipe(file);
                
                        file.on("finish", () => {
                            file.close();
                        
                            let filePath = path.join(__dirname,`./downloads/file${ctx.chat.id}.zip`);
                            fs.readFile(filePath, (err, data) => {
                                if (!err) {
                                    // ctx.telegram.sendDocument(ctx.chat.id, data)
                                    ctx.reply("done")
                                    fs.unlink(filePath, () => {
                                        console.log("deleted")
                                    })
                                }
                                else {
                                    ctx.reply("Download Error! Please try Again")
                                }
                            })
                           
                        }).on("error", (e) => {
                            fs.unlink(filePath,() => {
                                console.log("deleted")
                            })
                           ctx.reply("Download Error! Please try Again")
                        });
                            
                        });
                 
                    
                    } catch (e) {
                        console.log(e)
                    }
                  
                    
                }).catch(e=>ctx.reply("Repositary Not Found!"))
               
        
            } catch (e) {
                console.log(e.data?.message)
            }
           
        }
    } catch (e) {
        ctx.reply(e.code)
    }


}) 


bot.launch()



