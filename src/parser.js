import { Game_Action, Game_Round, Game_Replay } from './game.js';

//=============================================================================
// ** Parser_TenhouGame
//=============================================================================

export class Parser_TenhouGame {

  constructor(xmlDocument) {
    this.xmlDocument = xmlDocument;
    this.replay = new Game_Replay();
  }

  parseLog() {
    const nodes = this.xmlDocument.getElementsByTagName('mjloggm')[0].childNodes;
    nodes.forEach(node => this.parseNode(node));

    return this.replay;
  }

  parseNode(node) {
    switch(node.nodeName) {
      case 'UN':
        this.parseUnNode(node);
        break;
      case 'INIT':
        this.parseInitNode(node);
        break;
      case (node.nodeName.match(/^[DEFG]\d+/) || {}).input:
        this.parseDiscardNode(node);
        break;
      case (node.nodeName.match(/^[TUVW]\d+/) || {}).input:
        this.parseDrawNode(node);
        break;
      case 'N':
        this.parseCallNode(node);
        break;
      case 'REACH':
        this.parseRiichiNode(node);
        break;
      case 'AGARI':
        this.parseAgariNode(node);
        break;
    }
  }

  parseUnNode(node) {
    const dan_ranks = node.attributes['dan'].value.split(',').map(s => Number(s));
    const ratings = node.attributes['rate'].value.split(',').map(s => Number(s));

    for (let i = 0; i < 4; i++) {
      const actor = this.replay.actors[i];

      actor.name = decodeURI(node.attributes['n' + String(i)].value);
      actor.dan = dan_ranks[i];
      actor.rating = ratings[i]
    }
  }

  parseInitNode(node) {
    const seed = node.attributes['seed'].value.split(',').map(s => Number(s));

    const round = new Game_Round(this.replay.actors, seed[0], seed[1]);
    
    round.riibou = seed[2];
    round.dora[0] = seed[5];
    round.points = node.attributes['ten'].value.split(',').map(s => Number(s) * 100);

    for (let i = 0; i < 4; i++) {
      round.haipai[i] = node.attributes['hai' + String(i)].value.split(',').map(s => Number(s));
    }

    this.replay.addRound(round);
  }

  parseDrawNode(node) {
    const currentRound = this.replay.lastRound;

    const actor = node.nodeName.charCodeAt(0) - 'T'.charCodeAt();
    const tile = Number(node.nodeName.match(/\d+/)[0]);

    currentRound.wall.push(tile);

    const action = new Game_Action('draw', actor, {'tile': tile});
    currentRound.actions.push(action);
  }

  parseDiscardNode(node) {
    const currentRound = this.replay.lastRound;

    const actor = node.nodeName.charCodeAt(0) - 'D'.charCodeAt();
    const tile = Number(node.nodeName.match(/\d+/)[0]);

    const lastAction = currentRound.actions[currentRound.actions.length - 1];

    const action = new Game_Action(
      'discard',
      actor,
      {'tile': tile, 'lastAction': lastAction },
    );

    currentRound.actions.push(action);
  }

  parseCallNode(node) {
    const currentRound = this.replay.lastRound;

    const actor = Number(node.attributes['who'].value);
    const data = this.parseCall(Number(node.attributes['m'].value));
    data.target = (actor + data.target) % 4; 

    const action = new Game_Action('call', actor, data);
    currentRound.actions.push(action);
  }

  parseRiichiNode(node) {
    const currentRound = this.replay.lastRound;

    const actor = Number(node.attributes['who'].value);
    let action = null;

    switch (node.attributes['step'].value) {
      case "1":
        action = new Game_Action('riichi_call', actor, null);
        break;
      case "2":
        action = new Game_Action('riichi_success', actor, null);
        break;
    }

    currentRound.actions.push(action);
  }

  parseAgariNode(node) {
    const currentRound = this.replay.lastRound;

    const actor = Number(node.attributes['who'].value);
    const data = {}

    data['target'] = Number(node.attributes['fromWho'].value);
    data['yaku'] = node.attributes['yaku'].value.split(',').map(s => Number(s));
    data['score'] = node.attributes['ten'].value.split(',').map(s => Number(s));

    data['uraDora'] = null;

    if (node.attributes['doraHaiUra']) {
      data['uraDora'] = node.attributes['doraHaiUra'].value.split(',').map(s => Number(s));
    }

    const action = new Game_Action('agari', actor, data);
    currentRound.actions.push(action);
  }

  //---------------------------------------------------------------------------
  // * Parse Calls
  //---------------------------------------------------------------------------

  parseCall(meld) {
    const callee_rel = meld & 0x3;

    let mentsu = null;
    let callType = null;

    if (meld & 4) {
      mentsu = this.parseChi(meld);
      callType = 'chi'; 
    } else if (meld & 8) {
      mentsu = this.parsePon(meld);
      callType = 'pon';
    } else if (meld & 16) {
      mentsu = this.parseAddedKan(meld);
      callType = 'kakan';
    } else {
      mentsu = this.parseKan(meld);
      callType = (callee_rel ? 'minkan' : 'ankan');
    }

    return { 
      target: callee_rel, 
      mentsu: mentsu, 
      callType: callType 
    };
  }

  parseChi(meld) {
    let t = (meld & 0xfc00) >> 10;
    const calledTile = t % 3;

    t = Math.floor(t / 3);
    t = 9 * Math.floor(t / 7) + (t % 7);
    t *= 4;

    const mentsu = [
      t + ((meld & 0x0018) >> 3),
      t + ((meld & 0x0060) >> 5) + 4,
      t + ((meld & 0x0180) >> 7) + 8,
    ]

    if (calledTile === 1) {
      return [mentsu[1], mentsu[0], mentsu[2]];
    } else if (calledTile === 2) {
      return [mentsu[2], mentsu[0], mentsu[1]];
    }

    return mentsu
  }

  parsePon(meld) {
    const unused = (meld & 0x0060) >> 5;

    let t = (meld & 0xfe00) >> 9;
    const calledTile = t % 3;

    t = Math.floor(t / 3) * 4;
    
    let mentsu = [t, t + 1, t + 2, t + 3];

    // Remove the unused tile from the mentsu
    mentsu.splice(mentsu.indexOf(t + unused), 1);

    if (calledTile === 1) {
      mentsu = [mentsu[1], mentsu[0], mentsu[2]];
    } else if (calledTile === 2) {
      mentsu = [mentsu[2], mentsu[0], mentsu[1]];
    }

    // Don't understand why we need to do this...
    const kui = meld & 0x3;

    if (kui < 3) {
      mentsu = [mentsu[2], mentsu[0], mentsu[1]];
    }
      
    if (kui < 2) {
      mentsu = [mentsu[2], mentsu[0], mentsu[1]];
    }

    return mentsu;
  }

  parseKan() {
    return null;
  }

}
