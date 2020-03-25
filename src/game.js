import * as Config from './config.js';
import { SimulationAdapter } from './simulator/simulate.js';

//=============================================================================
// ** Game_Action
//=============================================================================

export class Game_Action {

  constructor(action_type, actor, data) {
    this.action_type = action_type;
    this.actor = actor;
    this.data = data;
  }

}

//=============================================================================
// ** Game_Call
//=============================================================================

export class Game_Call {

  constructor(mentsu, target) {
    this.mentsu = mentsu;
    this.target = target;
  }

}

//=============================================================================
// ** Game_Hand
//=============================================================================

export class Game_Hand {

  constructor(actor) {
    this.actor = actor;
    this.tiles = [];
    this.calls = [];
  }

  refreshHaipai(tiles) {
    this.tiles = tiles;
    this.sortTiles();
  }

  getTileAtIndex(index) {
    if (index >= this.tiles.length) {
      return -1;
    }

    return this.tiles[index];
  }

  getDrawnTile() {
    if (this.tiles.length % 3 === 2) {
      return this.getTileAtIndex(this.tiles.length - 1);
    }

    return -1;
  }
  
  sortTiles() {
    this.tiles.sort((a, b) => a - b);
  }

  sortWithDrawnTile(drawnTile) {
    const index = this.tiles.indexOf(drawnTile);

    this.tiles.splice(index, 1);
    this.sortTiles();
    this.tiles.push(drawnTile);
  }

  drawTile(tile) {
    this.tiles.push(tile);
  }

  discardTile(tile) {
    const index = this.tiles.indexOf(tile);

    this.tiles.splice(index, 1);
    this.sortTiles();
  }

  performCall(mentsu, target) {
    mentsu.forEach((tile) => {
      if (this.tiles.includes(tile)) {
        const index = this.tiles.indexOf(tile);

        this.tiles.splice(index, 1);
      }
    });

    this.calls.push(new Game_Call(mentsu, target));

    this.sortTiles();
  }

  rewindLastCall() {
    // TODO: Special casing for kans
    const lastCall = this.calls.pop();

    const callee_rel = (4 + lastCall.target - this.actor.index) % 4;
    const tileIndex = (callee_rel - 1) % 2;

    const calledTile = lastCall.mentsu[tileIndex];

    lastCall.mentsu.forEach(tile => {
      if (tile !== calledTile) {
        this.tiles.push(tile);
      }
    });

    this.sortTiles();
    
    return calledTile;
  }

}

//=============================================================================
// ** Game_Actor
//=============================================================================

export class Game_Actor {

  constructor(index) {
    this.index = index;

    this.name = '';
    this.dan = 0;
    this.rating = 0;

    this.points = 25000;

    this.riichiStep = 0;
    this.riichiIndex = -1;

    this.hand = new Game_Hand(this);
    this.discards = [];
    this.hasDrawnTile = false;

    this.voice = -1;
  }

  refresh() {
    this.discards = [];
  }

  drawTile(tile) {
    this.hand.drawTile(tile);
    this.hasDrawnTile = true;
  }

  discardTile(tile) {
    this.hand.discardTile(tile);
    this.discards.push(tile);

    if (this.riichiStep === 1) {
      this.riichiIndex = this.discards.length - 1;
    }

    this.hasDrawnTile = false;
    this.voice = -1;
  }

  performCall(mentsu, target, callType) {
    this.hand.performCall(mentsu, target);
    this.voice = Config.CALL_TYPE_TO_CALL_VOICE[callType];
  }

  performRiichiCall() {
    this.riichiStep = 1;
    this.voice = 0;
  }

  performRiichiSuccess() {
    this.riichiStep = 2;
    this.points -= 1000;
  }

  rewindDraw(tile) {
    this.hand.discardTile(tile);
    this.hasDrawnTile = false;
  }

  rewindDiscard(tile, lastAction) {
    const discardTile = this.discards.pop();

    if (discardTile !== tile) {
      console.log('DEBUG: This should never happen.');
    }

    this.hand.drawTile(tile);

    if (lastAction.action_type === 'draw') {
      this.hand.sortWithDrawnTile(lastAction.data.tile);
      this.hasDrawnTile = true;
    } else {
      this.hand.sortTiles();
      this.hasDrawnTile = false;
    }

    switch (lastAction.action_type) {
      case 'call':
        this.voice = Config.CALL_TYPE_TO_CALL_VOICE[lastAction.data.callType];
        break;
      case 'riichi_call':
        this.voice = 0;
        break;
      default:
        this.voice = -1;
    }
  }

  rewindCall() {
    this.voice = -1;

    return this.hand.rewindLastCall();
  }

  rewindRiichiCall() {
    this.riichiStep = 0;
    this.riichiIndex = -1;
    this.voice = -1;
  }

  rewindRiichiSuccess() {
    this.riichiStep = 1;
    this.points += 1000;
  }

}

//=============================================================================
// ** Game_Round
//=============================================================================

export class Game_Round {

  constructor(actors, round, homba) {
    this.actors = actors;

    this.round = round;
    this.homba = homba;
    this.riibou = 0;
    this.dora = [-2, -2, -2, -2, -2];
    this.points = [];

    this.wall = [];
    this.haipai = [null, null, null, null];

    this.actions = [];
    this.currentAction = 0;
    this.tilesLeft = 70;
  }

  //--------------------------------------------------------------------------
  // * Getters and Setters
  //--------------------------------------------------------------------------

  getActorWind(actor) {
    const remainder = (actor - this.round) % 4;

    return (remainder < 0 ? remainder + 4 : remainder);
  }

  //--------------------------------------------------------------------------
  // * Refresh
  //--------------------------------------------------------------------------

  refreshWall() {
    this.wall = new Array(136).fill(0).map((_, index) => index);

    // Remove all the haipai tiles
    this.haipai.forEach(hand => {
      hand.forEach(tile => this.wall.splice(this.wall.indexOf(tile), 1));
    });

    // Remove the dora tile
    this.wall.splice(this.wall.indexOf(this.dora[0]), 1);

    this.tilesLeft = 70;
  }

  //--------------------------------------------------------------------------
  // * Action Loop Processing
  //--------------------------------------------------------------------------

  performCurrentAction() {
    if (this.currentAction === this.actions.length) {
      return;
    }

    const action = this.actions[this.currentAction];

    switch(action.action_type) {
      case 'draw':
        this.performDrawAction(action);
        break;
      case 'discard':
        this.performDiscardAction(action);
        break;
      case 'call':
        this.performCallAction(action);
        break;
      case 'riichi_call':
        this.performRiichiCall(action);
        break;
      case 'riichi_success':
        this.performRiichiSuccess(action);
        break;
      case 'agari':
        this.performAgari(action);
        break;
    }

    this.currentAction += 1;
  }

  rewindCurrentAction() {
    if (this.currentAction === 0) {
      return;
    }

    const action = this.actions[this.currentAction - 1];

    switch(action.action_type) {
      case 'draw':
        this.rewindDrawAction(action);
        break;
      case 'discard':
        this.rewindDiscardAction(action);
        break;
      case 'call':
        this.rewindCallAction(action);
        break;
      case 'riichi_call':
        this.rewindRiichiCall(action);
        break;
      case 'riichi_success':
        this.rewindRiichiSuccess(action);
        break;
      case 'agari':
        this.rewindAgari(action);
        break;
    }

    this.currentAction -= 1;
  }

  rewindToStart() {
    while (this.currentAction !== 0) {
      this.rewindCurrentAction();
    }
  }

  //--------------------------------------------------------------------------
  // * Perform Action
  //--------------------------------------------------------------------------

  performDrawAction(action) {
    this.wall.splice(this.wall.indexOf(action.data.tile), 1);
    this.actors[action.actor].drawTile(action.data.tile);

    this.tilesLeft -= 1;
  }

  performDiscardAction(action) {    
    const tile = action.data.tile;

    this.actors[action.actor].discardTile(tile);
  }

  performCallAction(action) {
    this.actors[action.actor].performCall(
      action.data.mentsu,
      action.data.target,
      action.data.callType
    )

    this.actors[action.data.target].discards.pop();
  }

  performRiichiCall(action) {
    this.actors[action.actor].performRiichiCall();
  }

  performRiichiSuccess(action) {
    this.actors[action.actor].performRiichiSuccess();
  }

  performAgari(action) {
    this.actors[action.actor].voice = (action.data.target == action.actor ? 2 : 1);
  }

  rewindDrawAction(action) {
    const tile = action.data.tile;

    this.wall.unshift(tile);
    this.actors[action.actor].rewindDraw(tile);

    this.tilesLeft += 1;
  }

  rewindDiscardAction(action) {
    this.actors[action.actor].rewindDiscard(
      action.data.tile,
      action.data.lastAction,
    );
  }

  rewindCallAction(action) {
    const tile = this.actors[action.actor].rewindCall();

    this.actors[action.data.target].discards.push(tile);
  }

  rewindRiichiCall(action) {
    this.actors[action.actor].rewindRiichiCall();
  }

  rewindRiichiSuccess(action) {
    this.actors[action.actor].rewindRiichiSuccess();
  }

  rewindAgari(action) {
    this.actors[action.actor].voice = -1;
  }

}

//=============================================================================
// ** Game_SimulationAdapter
//=============================================================================

export class Game_SimulationAdapter { 

  static convertWall(gameWall) {
    const simulationWall = new Array(34).fill(0);

    gameWall.forEach(tile => simulationWall[Math.floor(tile / 4)] += 1);

    return simulationWall;
  }

  static convertHand(gameHand) {
    const simulationHand = [];

    gameHand.tiles.forEach(tile => simulationHand.push(Math.floor(tile / 4)));
    
    return simulationHand.sort((a, b) => a - b);  
  }

}

//=============================================================================
// ** Game_Replay
//=============================================================================

export class Game_Replay {
  
  constructor() {
    this.simulation = new SimulationAdapter();
    
    this.rounds = [];
    this.roundIndex = 0;

    this.playerIndex = 0;

    this.initializeActors();
  }

  //--------------------------------------------------------------------------
  // * Initialization Methods
  //--------------------------------------------------------------------------

  initializeActors() {
    this.actors = [];

    for (let i = 0; i < 4; i++) {
      this.actors.push(new Game_Actor(i));
    }
  }

  //--------------------------------------------------------------------------
  // * Getters and Setters
  //--------------------------------------------------------------------------

  get currentRound() {
    return this.rounds[this.roundIndex];
  }

  get lastRound() {
    return this.rounds[this.rounds.length - 1];
  }

  get simulationPayload() {
    const payload = {};

    payload.wall = Game_SimulationAdapter.convertWall(this.currentRound.wall);
    payload.wallTiles = this.currentRound.wall.length;

    payload.hands = this.actors.map(
      actor => Game_SimulationAdapter.convertHand(actor.hand)
    );

    return payload;
  }

  addRound(round) {
    this.rounds.push(round);
  }

  //--------------------------------------------------------------------------
  // * Round Flow Logic
  //--------------------------------------------------------------------------

  startCurrentRound() {
    const round = this.currentRound;

    this.actors.forEach((actor, index) => {
      actor.points = round.points[index];
      actor.hand.refreshHaipai(round.haipai[index]);
    });

    round.refreshWall();

    this.simulation.dirty = true;
  }

  performCurrentAction() {
    this.currentRound.performCurrentAction();
    this.simulation.markDirty();
  }

  rewindCurrentAction() {
    this.currentRound.rewindCurrentAction();
    this.simulation.markDirty();
  }

  gotoNextRound() {
    if (this.roundIndex === this.rounds.length - 1) {
      return;
    }

    this.simulation.markDirty();
    this.currentRound.rewindToStart();

    this.roundIndex += 1;
    this.startCurrentRound();
  }

  gotoPreviousRound() {
    this.simulation.markDirty();
    this.currentRound.rewindToStart();

    if (this.roundIndex === 0) {
      return;
    }

    this.roundIndex -= 1;
    this.startCurrentRound();
  }

  //--------------------------------------------------------------------------
  // * Simulation Logic
  //--------------------------------------------------------------------------

  simulateHitori(playerIndex, drawsLeft, endShanten) {
    this.simulation.processGameState(this.simulationPayload);
    
    return this.simulation.simulateHitori(playerIndex, drawsLeft, endShanten);
  }

  simulateBlackBoxShoubu(playerIndex, oppUkeire, drawsLeft, currentPlayer) {
    this.simulation.processGameState(this.simulationPayload);
    
    return this.simulation.simulateBlackBoxShoubu(
      playerIndex,
      oppUkeire,
      drawsLeft,
      currentPlayer,
    );
  }

}