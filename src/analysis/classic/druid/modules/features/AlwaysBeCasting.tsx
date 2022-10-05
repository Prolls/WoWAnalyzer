import { t } from '@lingui/macro';
import { formatPercentage } from 'common/format';
import { Options } from 'parser/core/Analyzer';
import { When } from 'parser/core/ParseResults';
import CoreAlwaysBeCastingHealing from 'parser/shared/modules/AlwaysBeCastingHealing';

import lowRankSpells, { LowRankSpells } from '../../lowRankSpells';
import * as SPELLS from '../../SPELLS';

class AlwaysBeCasting extends CoreAlwaysBeCastingHealing {
  static HEALING_ABILITIES_ON_GCD: number[] = [
    SPELLS.TRANQUILITY,
    SPELLS.REMOVE_CURSE,
    SPELLS.REJUVENATION,
    SPELLS.REGROWTH,
    SPELLS.REBIRTH,
    SPELLS.MARK_OF_THE_WILD,
    SPELLS.LIFEBLOOM,
    SPELLS.INNERVATE,
    SPELLS.HEALING_TOUCH,
    SPELLS.CURE_POISON,
    SPELLS.ABOLISH_POISON,
  ];

  constructor(options: Options) {
    super(options);

    const maxRankSpells: number[] = AlwaysBeCasting.HEALING_ABILITIES_ON_GCD;

    const lrs: LowRankSpells = lowRankSpells;
    for (const spell_id of maxRankSpells) {
      AlwaysBeCasting.HEALING_ABILITIES_ON_GCD = AlwaysBeCasting.HEALING_ABILITIES_ON_GCD.concat(
        lrs[spell_id],
      );
    }
    AlwaysBeCasting.HEALING_ABILITIES_ON_GCD = AlwaysBeCasting.HEALING_ABILITIES_ON_GCD.filter(
      (id: number) => Boolean(id),
    );
  }

  suggestions(when: When) {
    const deadTimePercentage = this.totalTimeWasted / this.owner.fightDuration;

    when(deadTimePercentage)
      .isGreaterThan(0.15)
      .addSuggestion((suggest, actual, recommended) =>
        suggest('Your downtime can be improved. Try to Always Be Casting (ABC).')
          .icon('spell_mage_altertime')
          .actual(
            t({
              id: 'priest.holy.suggestions.alwaysBeCasting.downtime',
              message: `${formatPercentage(actual)}% downtime`,
            }),
          )
          .recommended(`<${formatPercentage(recommended)}% is recommended`)
          .regular(recommended + 0.05)
          .major(recommended + 0.05),
      );
  }
}

export default AlwaysBeCasting;