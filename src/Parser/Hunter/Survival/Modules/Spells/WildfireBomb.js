import React from 'react';

import Analyzer from 'Parser/Core/Analyzer';

import SPELLS from 'common/SPELLS';
import { formatPercentage } from 'common/format';
import StatisticBox from 'Interface/Others/StatisticBox';
import SpellIcon from 'common/SpellIcon';
import Enemies from 'Parser/Core/Modules/Enemies';
import SpellUsable from 'Parser/Core/Modules/SpellUsable';
import StatTracker from 'Parser/Core/Modules/StatTracker';
import SpellLink from 'common/SpellLink';
import STATISTIC_ORDER from 'Interface/Others/STATISTIC_ORDER';

/**
 * Hurl a bomb at the target, exploding for (45% of Attack power) Fire
 * damage in a cone and coating enemies in wildfire, scorching them for (90%
 * of Attack power) Fire damage over 6 sec.
 */

const GCD_BUFFER = 500; //People aren't robots, give them a bit of leeway in terms of when they cast WFB to avoid capping on charges
const MS_BUFFER = 200;

class WildfireBomb extends Analyzer {
  static dependencies = {
    enemies: Enemies,
    spellUsable: SpellUsable,
    statTracker: StatTracker,
  };

  acceptedCastDueToCapping = false;
  currentGCD = 0;
  badRefreshes = 0;
  lastRefresh = 0;
  casts = 0;
  targetsHit = 0;

  constructor(...args) {
    super(...args);
    this.active = !this.selectedCombatant.hasTalent(SPELLS.WILDFIRE_INFUSION_TALENT.id); //WFI changes WFB so much that a separate module will be added into talents folder to handle everything from that.
  }

  on_byPlayer_cast(event) {
    const spellId = event.ability.guid;
    if (spellId !== SPELLS.WILDFIRE_BOMB.id) {
      return;
    }
    this.casts++;
    this.currentGCD = (Math.max(1.5 / (1 + this.statTracker.currentHastePercentage), 0.75) * 1000);
    if (this.spellUsable.cooldownRemaining(SPELLS.WILDFIRE_BOMB.id) < GCD_BUFFER + this.currentGCD || !this.spellUsable.isOnCooldown(SPELLS.WILDFIRE_BOMB.id)) {
      this.acceptedCastDueToCapping = true;
    }
  }

  on_byPlayer_damage(event) {
    const spellId = event.ability.guid;
    if (spellId !== SPELLS.WILDFIRE_BOMB_IMPACT.id) {
      return;
    }
    if (this.casts === 0) {
      this.casts++;
      this.spellUsable.beginCooldown(SPELLS.WILDFIRE_BOMB.id, this.owner.fight.start_time);
    }
    this.targetsHit++;
    const enemy = this.enemies.getEntity(event);
    if (this.acceptedCastDueToCapping || !enemy) {
      return;
    }
    if (enemy.hasBuff(SPELLS.WILDFIRE_BOMB_DOT.id) && event.timestamp > this.lastRefresh + MS_BUFFER) {
      this.badRefreshes++;
      this.lastRefresh = event.timestamp;
    }
  }

  get uptimePercentage() {
    return this.enemies.getBuffUptime(SPELLS.WILDFIRE_BOMB_DOT.id) / this.owner.fightDuration;
  }

  get badWFBThresholds() {
    return {
      actual: this.badRefreshes,
      isGreaterThan: {
        minor: 2,
        average: 4,
        major: 6,
      },
      style: 'number',
    };
  }

  get uptimeThresholds() {
    return {
      actual: this.uptimePercentage,
      isLessThan: {
        minor: 0.4,
        average: 0.35,
        major: 0.3,
      },
      style: 'percent',
    };
  }

  suggestions(when) {
    when(this.badWFBThresholds).addSuggestion((suggest, actual, recommended) => {
      return suggest(<React.Fragment>You shouldn't refresh <SpellLink id={SPELLS.WILDFIRE_BOMB.id} /> since it doesn't pandemic. It's generally better to cast something else and wait for the DOT to drop off before reapplying.</React.Fragment>)
        .icon(SPELLS.WILDFIRE_BOMB.icon)
        .actual(`${actual} casts unnecessarily refreshed WFB`)
        .recommended(`<${recommended} is recommended`);
    });
    when(this.uptimeThresholds).addSuggestion((suggest, actual, recommended) => {
      return suggest(<React.Fragment>Try and maximize your uptime on <SpellLink id={SPELLS.WILDFIRE_BOMB.id} />. This is achieved through not unnecessarily refreshing the debuff as it doesn't pandemic. </React.Fragment>)
        .icon(SPELLS.WILDFIRE_BOMB.icon)
        .actual(`${formatPercentage(actual)}% uptime`)
        .recommended(`>${formatPercentage(recommended)}% is recommended`);
    });
  }
  get averageTargetsHit() {
    return (this.targetsHit / this.casts).toFixed(2);
  }
  statistic() {
    return (
      <StatisticBox
        icon={<SpellIcon id={SPELLS.WILDFIRE_BOMB.id} />}
        value={`${this.averageTargetsHit}`}
        label="Average targets hit"
        tooltip={`You had an uptime of ${formatPercentage(this.uptimePercentage)}%.`}
      />
    );
  }
  statisticOrder = STATISTIC_ORDER.CORE(9);
}

export default WildfireBomb;
