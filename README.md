# tank-tactics
Tank Tactics is an implementation of the game "Tank Turn Tactics" from [this GDC talk](https://youtu.be/t9WMNuyjm4w). I made it as close as possible to the game described in the talk, so I recommend watching it and learning the rules that way. For the people who don't want to do that, I have this guide for them.

| README Links          |      Description          |
| :-------------------- | :-----------------------: |
| [Rules](#rules) | The rules of the game. |
| [Hosting the game](#hosting-the-game)|How to host and enter the game. |

# Rules
## Goal of the game
The goal of the game is to be the last player standing. You achieve this by attacking others, forming alliances and
outsmarting your opponents with superior group strategy.

## Stats
Each player has 3 stats. They are the following:

### Health (HP)
Health (or HP) is the amount of health a player has left. Every player starts with 3 Health. You can [Attack](#attacking) players to lower their HP. HP can not be healed. Once a player's HP drops to 0, they join [the Jury](#jury) and are no longer able to interact with other players.

### Action Points (AP)
Action points (or AP) are used to [do everything in this game](#actions). Every player starts with one. You can give AP to other players. Once every in-game day, every alive player gets one more AP. You can also obtain AP through [the Jury](#jury).

### Range
Range is the distance where you can't interact with players further than that distance. Every player's range starts at 2. Range can be [upgraded](#upgrading-your-range). You can see your range as the yellow squares around you.

## Actions
There are 4 actions that are able to do in the game, and they are the following:

### Moving
Moving is changing your position. You are able to move one square in any direction (without the diagonals) per [AP](#action-points-ap).

### Attacking
Attacking is reducing another player's [HP](#health-hp). You can only attack in your [range](#range). You remove one HP from your opponent per [AP](#action-points-ap) used.

### Giving AP
You can give [AP](#action-points-ap) to players in your range. You give 1 AP per AP.

### Upgrading Your Range
You can upgrade your [range](#range). You increase your range by 1 for every 2 [AP](#action-points-ap) used.

## Jury
When a player dies, they join the jury. Everyone in the jury votes every in-game day and when the vote ends, every player with 3+ votes gets one extra [AP](#action-points-ap). If you don't vote, your vote will be wasted.

## Spectating
You can spectate. This means watching the game without being logged in.

# Hosting the game
I will assume that you have installed nodejs.  
### 1. Install dependencies
Install the project dependencies with `npm install`.

### 2. Get certificates
If your hosting provider supplies them by default, skip this step.
You need to aquire two files: a private key and a certificate. If you don't know how, you can *generate a self-signed certificate*.

### 3. Set your environment variables
Create a `.env` file and config the following things. (Or enter the environment variables manually into a dashboard of some kind).  
Example `.env`:
```SHELL
PORT=8080
ADMIN_PASSWORD="12345678"
USE_HTTPS=true
KEY_PATH="certs/key.pem"
CRT_PATH="certs/cert.pem"
```

Remember to set an admin password. If there is none, the default one is "`password`".

The PORT variable gets used only if the server hasn't set a default PORT already.  
If there isn't either, port `8080` will be used.

#### In case you got your own key and certificate (step 2)
Put their paths in the `KEY_PATH` and `CRT_PATH` env. variables.

#### In case your hosting gets them for you (skipped step 2)
Remove the lines that set paths to a key and certificate and set `USE_HTTPS` to `false`

### 4. Launch the game
You can do that with `npm start`, or if you're using a platform host, it should be done automatically. Now you can play.

### 5. Start and manage the game
Once you decide that everyone who you want playing has registered, you can start the game. This can happen in 2 ways:
1. Open the url `<the game url>/api/startGame?password=<the admin password>`
2. Open the console in `<the game url>/console` and put in the command `_startGame();`. Also if you want to reset the game completely, this is the command you use.

Once you do, players will start receiving AP every day at the same time you started the game.

If you want to disable the console for whatever reason, simply create a file named `.disableEval` in the main directory.