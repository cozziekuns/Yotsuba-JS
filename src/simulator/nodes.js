import { Util, ConfigurationUtil } from './util.js';

//=============================================================================
// ** ConfigurationNode
//=============================================================================

export class ConfigurationNode {

  constructor(configurationList, memo) {
    this.configurationList = configurationList;
    this.shanten = ConfigurationUtil.calculateConfigurationShanten(
      configurationList[0],
    );

    this.outs = [];
    this.outsMapList = [];
    this.children = new Map();
    this.memo = memo;
    
    this.calculateOutsMapList();
    this.calculateOuts();
    this.createTilesToDiscard();
    this.spawnChildren();
  }

  //--------------------------------------------------------------------------
  // * Initialization Methods
  //--------------------------------------------------------------------------

  createTilesToDiscard() {
    this.tilesToDiscard = new Map();

    this.outs.forEach(out => {
      const tileArray = new Array(18).fill(-1);

      this.tilesToDiscard.set(out, tileArray);
    });
  }

  //--------------------------------------------------------------------------
  // * Getters and Setters
  //--------------------------------------------------------------------------

  get hashCode() {
    return this.getConfigurationListHashCode(this.configurationList);
  }

  getConfigurationListHashCode(configurationList) {
    const tiles = configurationList[0].reduce((total, configuration) => {
      return total.concat(...configuration);
    }, []);
  
    return tiles.sort((a, b) => a - b).toString();
  }

  //--------------------------------------------------------------------------
  // * Ukeire Calculation
  //--------------------------------------------------------------------------

  calculateOuts() {
    const outs = this.outsMapList.reduce(
      (total, outsMap) => total = total.concat(Array.from(outsMap.keys())),
      [],
    );

    this.outs = [...new Set(outs)];
  }

  calculateOutsMapList() {
    this.outsMapList = this.configurationList.map(
      configuration => this.getOutsMapForConfiguration(configuration)
    );
  }
    
  getOutsMapForConfiguration(configuration) {
    const outsMap = new Map();
  
    const atamaCandidates = configuration.filter(
      shape => shape.length === 2 && shape[0] === shape[1]
    );
  
    const mentsu = configuration.filter(shape => shape.length === 3);
    const taatsu = configuration.filter(shape => shape.length === 2);
    const floatTiles = configuration.filter(shape => shape.length === 1);
  
    if (atamaCandidates.length === 1) {
      taatsu.splice(taatsu.indexOf(atamaCandidates[0]), 1);
    }
  
    taatsu.forEach(shape => {
      ConfigurationUtil.getOutsForShape(shape).forEach(
        tile => Util.addToBucketMap(outsMap, tile, shape)
      );
    });
    
    if (
      mentsu.length + taatsu.length === 4
      && atamaCandidates.length === 0
    ) {
      // When we have four blocks but no atama, floats becoming atama
      // decreases shanten.
      floatTiles.forEach(
        shape => Util.addToBucketMap(outsMap, shape[0], shape)
      );
    } else if (mentsu.length + taatsu.length < 4) {
      floatTiles.forEach(shape => {
        ConfigurationUtil.getOutsForShape(shape).forEach(
          tile => Util.addToBucketMap(outsMap, tile, shape)
        );
      });
    }

    return outsMap;
  }

  //--------------------------------------------------------------------------
  // * Spawn Children Nodes
  //--------------------------------------------------------------------------

  calculateConfigurationListForOut(configuration, outsMap, out) {
    outsMap.get(out).forEach(shape => {
      const newConfiguration = configuration.slice();

      newConfiguration.splice(newConfiguration.indexOf(shape), 1);
      newConfiguration.push(shape.concat(out).sort((a, b) => a - b));

      const tilesToRemove = newConfiguration.filter(
        shape => shape.length === 1
      );
      const blocks = newConfiguration.filter(shape => shape.length > 1);
      
      if (blocks.length === 5) {
        const tile = tilesToRemove[0];

        newConfiguration.splice(newConfiguration.indexOf(tile), 1);

        Util.addToBucketMap(
          this.children.get(out),
          tile[0],
          newConfiguration,
        );
      } else {
        tilesToRemove.forEach(tile => {
          const configurationWithoutTile = newConfiguration.slice();

          configurationWithoutTile.splice(
            configurationWithoutTile.indexOf(tile),
            1,
          );

          Util.addToBucketMap(
            this.children.get(out),
            tile[0],
            configurationWithoutTile
          );
        });
      }
    });
  }

  spawnChildren() {
    if (this.shanten === 0) {
      return;
    }

    this.outs.forEach(out => this.children.set(out, new Map()));

    this.configurationList.forEach((configuration, index) => {
      const outsMap = this.outsMapList[index];

      for (let out of outsMap.keys()) {
        this.calculateConfigurationListForOut(configuration, outsMap, out);
      }
    });

    this.children.forEach(childForOut => {
      childForOut.forEach((configurationList, tileToRemove) => {
        const hashCode = this.getConfigurationListHashCode(configurationList);

        if (!this.memo.has(hashCode)) { 
          this.memo.set(
            hashCode,
            new ConfigurationNode(configurationList, this.memo),
          );
        }

        childForOut.set(tileToRemove, this.memo.get(hashCode));
      });
    });
  }

}

//=============================================================================
// ** GameStateNode
//=============================================================================

export class GameStateNode {

  constructor(configurationNodes, memo) {
    this.configurationNodes = configurationNodes;
    this.children = [];
    this.memo = memo;

    this.spawnChildren();
  }

  getConfigurationNodesHashCode(configurationNodes) {
    return configurationNodes.reduce((total, node) => {
      return total + node.hashCode + '|'
    }, '');
  }

  spawnChildren() {
    for (let i = 0; i < this.configurationNodes.length; i++) {
      const configurationNode = this.configurationNodes[i];

      if (configurationNode.shanten === 0) {
        continue;
      }

      this.children[i] = new Map();

      // TODO: Encode drawsLeft into gameStateNode.
      for (let j = 0; j < configurationNode.outs.length; j++) {
        const out = configurationNode.outs[j];

        const discardTilesCache = configurationNode.tilesToDiscard.get(out);

        const newConfigurationNode = configurationNode.children.get(out).get(
          discardTilesCache.filter(value => value >= 0)[0],
        );

        if (!newConfigurationNode) {
          continue;
        }

        const newConfigurationNodes = this.configurationNodes.slice();
        newConfigurationNodes[i] = newConfigurationNode;

        const newHashCode = this.getConfigurationNodesHashCode(
          newConfigurationNodes,
        );

        if (!this.memo.has(newHashCode)) {
          this.memo.set(
            newHashCode,
            new GameStateNode(newConfigurationNodes, this.memo),
          );
        }

        this.children[i].set(out, this.memo.get(newHashCode));
      }
    }
  }

}