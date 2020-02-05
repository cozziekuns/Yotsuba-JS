//=============================================================================
// ** Parser_TenhouGame
//=============================================================================

class Parser_TenhouGame {

  constructor(xmlDocument) {
    this.xmlDocument = xmlDocument;
    this.replay = new Game_Replay();
  }

  parseLog() {
    let nodes = this.xmlDocument.getElementsByTagName('mjloggm')[0].childNodes;
    nodes.forEach(node => this.parseNode(node));

    return this.replay;
  }

  parseNode(node) {
    switch(node.nodeName) {
      case 'INIT':
        this.parseInitNode(node);
        break;
      case (node.nodeName.match(/^[DEFG]\d+/) || {}).input:
        this.parseDiscardNode(node);
        break;
      case (node.nodeName.match(/^[TUVW]\d+/) || {}).input:
        this.parseDrawNode(node);
        break;
      case 'REACH':
        this.parseRiichiNode(node);
        break;
      case 'AGARI':
        this.parseAgariNode(node);
        break;
    }
  }

  parseInitNode(node) {
    const seed = node.attributes['seed'].value.split(',').map(s => Number(s));

    const round = new Game_Round(seed[0], seed[1]);
    round.riibou = seed[2];
    round.dora = [seed[5]];
    round.points = node.attributes['ten'].value.split(',').map(s => Number(s) * 100);

    for (let i = 0; i < 4; i++) {
      const tiles = node.attributes['hai' + String(i)].value.split(',').map(s => Number(s));
      
      const hand = new Game_Hand(tiles);
      hand.sortTiles();

      round.hands.push(hand);
    }

    this.replay.addRound(round);
  }

  parseDrawNode(node) {
    const currentRound = this.replay.getLastRound();

    const actor = node.nodeName.charCodeAt(0) - 'T'.charCodeAt();
    const tile = node.nodeName.match(/\d+/)[0];

    currentRound.wall.push(tile);

    const action = new Game_Action('draw', actor, {'tile': tile});
    currentRound.actions.push(action);
  }

  parseDiscardNode(node) {
    const currentRound = this.replay.getLastRound();

    const actor = node.nodeName.charCodeAt(0) - 'D'.charCodeAt();
    const tile = node.nodeName.match(/\d+/)[0];

    const action = new Game_Action('discard', actor, {'tile': tile});
    currentRound.actions.push(action);
  }

  parseRiichiNode(node) {
    const currentRound = this.replay.getLastRound();

    const actor = Number(node.attributes['who'].value);
    let action = null;

    switch (node.attributes['step'].value) {
      case "1":
        action = new Game_Action('reach_call', actor, null);
        break;
      case "2":
        action = new Game_Action('reach_success', actor, null);
        break;
    }

    currentRound.actions.push(action);
  }

  parseAgariNode(node) {
    const currentRound = this.replay.getLastRound();

    const actor = Number(node.attributes['who']);
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

}
