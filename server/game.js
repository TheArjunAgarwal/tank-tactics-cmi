import {appendFileSync} from "fs";
import Queue from "../lib/lib_queue.js";
import Coord from "../lib/lib_coord.js";
const { dist } = Coord;
const crd = () => new Coord(...arguments);
import Grid from "../lib/lib_grid.js";
import { shuffleArray, humanTimestamp } from "../lib/lib_util.js";

function spreadPlayers(count, dim) {
    /// algoritum za opredelqne poziciite na count igracha v pole dim na dim
    let possible = Array(dim * dim).fill(null).map((_, idx) => crd(Math.floor(idx / dim), idx % dim));
    shuffleArray(possible);
    return possible.slice(0, count);
}

const FAIL = err => ({ success: false, result: err });
const SUCCEED = (change, event) => {
    appendFileSync("log.txt", `[${humanTimestamp()}] ${event}\r\n`);
    return { success: true, result: change };
};

export default class Game {
    constructor(users, dim) {
        if(arguments.length == 0){return;} // intended to create an empty object to use with deserialise
        this.dim = dim;
        this.grid = new Grid(dim);
        let positions = spreadPlayers(users.length, dim);
        this.players = {};
        this.alivePlayers = users.length;
        users.forEach((uname, idx) => {
            this.players[uname] = {
                name: uname,
                hp: 3,
                ap: 1,
                range: 2,
                pos: positions[idx],
                vote: null
            };
            this.grid[positions[idx]] = uname;
        });
        this.gameOver = false;
    }
    deserialise(str){
        throw new Error("TODO");
    }
    serialise(){
        throw new Error("TODO");
    }
    _win(winner){
        throw new Error("TODO");
    }
    _routeDist(from, to) {
        /// bfs
        let dists = new Grid(this.dim, Infinity);
        let front = new Queue();
        front.push({ pos: from, dist: 0 });
        while (dists[to] == Infinity && !front.isEmpty()) {
            const { pos, dist } = front.pop();
            if (dist < dists[pos]) {
                dists[pos] = dist;
                pos.getNeigh()
                    .filter(e => e.inBounds(this.dim))
                    .filter(e => this.grid[e] == null)
                    .forEach(e => front.push({ pos: e, dist: dist + 1 }));
            }
        }
        return dists[to];
    }
    _changes(player, stats) {
        let ret = [];
        stats.forEach(s => {
            ret.push({
                player: player,
                stat: s,
                val: this.players[player][s]
            });
        });
        return ret;
    }
    _move(agent, pos, routeLen) {
        this.grid[this.players[agent].pos] = null;
        this.grid[pos] = agent;
        this.players[agent].ap -= routeLen;
        this.players[agent].pos = pos;
        return [...this._changes(agent, ["ap", "pos"])];
    }
    tryMove(agent, pos) {
        if(this.players[agent].hp <= 0) return FAIL("You're dead.");
        if (!pos.inBounds(this.dim)) return FAIL("That space is outside of the board.");
        if (this.grid[pos] != null) return FAIL("That space is occupied.");
        let routeLen = this._routeDist(this.players[agent].pos, pos);
        if (routeLen > this.players[agent].ap) return FAIL("Not enough AP to go that far.");

        let changes = this.move(agent, pos, routeLen);
        return SUCCEED(changes, `${agent} moved to ${pos}`);
    }
    _attack(agent, patient, amount) {
        this.players[agent].ap -= amount;
        this.players[patient].hp -= amount;
        if(this.players[patient].hp <= 0){
            this.alivePlayers--;
            if(this.alivePlayers == 1){
                this._win(agent);
            }
        }
        return [...this.changes(agent, ["ap"]), ...this._changes(patient, ["hp"])];
    }
    tryAttack(agent, patient, amount) {
        if(this.players[agent].hp <= 0) return FAIL("You're dead.");
        if (!this.players[patient]) return FAIL("That player doesn't exist.");
        if (amount > this.players[agent].ap) return FAIL("Not enough AP to attack that much.");
        if (dist(this.players[agent].pos, this.players[patient].pos) > this.players[agent].range)
            return FAIL("Player is out of your range.");
        if (amount > this.players[patient].hp)
            return FAIL("You can't over-attack (attack for more hp than your opponent has).");

        let changes = this.attack(agent, patient, amount);
        return SUCCEED(changes, `${agent} attacked ${patient} for ${amount} HP`);
    }
    _give(agent, patient, amount) {
        this.players[agent].ap -= amount;
        this.players[patient].ap += amount;
        return [...this._changes(agent, ["ap"]), ...this._changes(patient, ["ap"])];
    }
    tryGive(agent, patient, amount) {
        if(this.players[agent].hp <= 0) return FAIL("You're dead.");
        if (!this.players[patient]) return FAIL("That player doesn't exist.");
        if (amount > this.players[agent].ap) return FAIL("Not enough AP to give that much.");
        if (dist(this.players[agent].pos, this.players[patient].pos) > this.players[agent].range)
            return FAIL("Player is out of your range.");

        let changes = this.give(agent, patient, amount);
        return SUCCEED(changes, `${agent} gave ${amount} AP to ${patient}`);
    }
    _upgrade(agent, amount) {
        this.players[agent].ap -= amount * 2;
        this.players[agent].range += amount;
        return [...this._changes(agent), ["ap", "range"]];
    }
    tryUpgrade(agent, amount) {
        if(this.players[agent].hp <= 0) return FAIL("You're dead.");
        if (amount * 2 > this.players[agent].ap) return FAIL("Not enough AP to upgrade your range that much.");
        let changes = this.upgrade(agent, amount);
        return SUCCEED(changes, `${agent} upgraded their range by ${amount}`);
    }
    _vote(agent, patient) {
        this.players[agent].vote = patient;
        return [...this._changes(agent, ["vote"])];
    }
    tryVote(agent, patient) {
        if (this.players[agent].hp > 0) return FAIL("You can't vote when still alive.");
        if(patient != null){
            if (!this.players[patient]) return FAIL("That player doesn't exist.");
            if (this.players[patient].hp <= 0) return FAIL("That player is also dead.");
        }
        let changes = this._vote(agent, patient);
        return SUCCEED(changes, `${agent} changed their vote to ${patient}`);
    }
    _giveOutVoteAP() {
        let changedUsers = { vote: new Set(), ap: new Set() };
        let counts = {};
        for (uname in this.players) { counts[uname] = 0 }
        this.players.filter(p => (p.hp <= 0 && p.vote != null)).forEach(p => {
            counts[p.vote]++;
            this.players[p.name].vote = null;
            changedUsers.vote.add(p.name);
        });
        for (uname in counts) {
            if (counts[uname] >= 3) {
                this.players[uname].ap++;
                changedUsers.ap.add(uname);
            }
        }
        return changedUsers;
    }
    giveOutAP() {
        let changedUsers = this._giveOutVoteAP();
        for (uname in this.players) {
            if (this.players[uname].hp > 0) {
                this.players[uname].ap++;
                changedUsers.vote.add(uname);
            }
        }
        let changes = [
            ...Array.from(changedUsers.vote).map(e => this._changes(e, ["vote"])),
            ...Array.from(changedUsers.ap).map(e => this._changes(e, ["ap"]))
        ];
        return SUCCEED(changes, `AP was given out and votes were reset`);
    }
}