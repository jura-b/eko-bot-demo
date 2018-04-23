# Installation

1. Install the latest version of nodejs 8.
2. Install node_modules and.
```sh
npm i
mv .env.example .env
```
3. Configure `.env` according to your parameters.

# Remark

* If you are running this code server on `localhost`, the webhook won't be able to reach you. (In this case, the webhook url is `https://${baseUrl}/bots/webhook`. Tell me if you need to change the webhook url. Actually, you will). Try host your server on public or maybe you could use `ngrok`, a private tunnel tool.
* The file that need to be mainly observed is `routes/bots.js`.

# Testing out

```sh
npm start
```

Then, try greet the bot. The bot should reply in a second.
