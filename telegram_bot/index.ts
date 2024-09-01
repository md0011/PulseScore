import { Telegraf } from "telegraf"
import { message } from "telegraf/filters"

const bot = new Telegraf(`${process.env.BOT_TOKEN}`)

bot.start((ctx) => ctx.reply('Welcome'))

bot.command('submit', (ctx) => ctx.reply('Form Submitted'))
bot.command('test', (ctx) => ctx.reply('yom'))

bot.help((ctx) => ctx.reply('Send me a sticker'))
bot.on(message('sticker'), (ctx) => ctx.reply('👍'))
bot.hears('hi', (ctx) => ctx.reply('Hey there'))

bot.launch()