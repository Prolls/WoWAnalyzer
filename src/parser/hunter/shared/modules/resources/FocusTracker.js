import RESOURCE_TYPES from 'game/RESOURCE_TYPES';
import ResourceTracker from 'parser/shared/modules/resourcetracker/ResourceTracker';
import SPELLS from 'common/SPELLS';

const BARBED_SHOT_SPELLS = [SPELLS.BARBED_SHOT_BUFF.id, SPELLS.BARBED_SHOT_BUFF_STACK_2.id, SPELLS.BARBED_SHOT_BUFF_STACK_3.id, SPELLS.BARBED_SHOT_BUFF_STACK_4.id, SPELLS.BARBED_SHOT_BUFF_STACK_5.id];
let BARBED_SHOT_REGEN = 5;

class FocusTracker extends ResourceTracker {
  constructor(...args) {
    super(...args);
    this.resource = RESOURCE_TYPES.FOCUS;
    if (this.selectedCombatant.hasTalent(SPELLS.SCENT_OF_BLOOD_TALENT.id)) {
      BARBED_SHOT_REGEN += 2;
    }
  }

  //Because energize events associated with certain spells don't provide a waste number, but instead a lower resourceChange number we can calculate the waste ourselves.
  on_toPlayer_energize(event) {
    if (event.resourceChangeType !== this.resource.id) {
      return;
    }
    const spellId = event.ability.guid;
    let waste;
    let gain;
    if (BARBED_SHOT_SPELLS.includes(spellId)) {
      gain = event.resourceChange;
      waste = BARBED_SHOT_REGEN - event.resourceChange;
    } else {
      waste = event.waste;
      gain = event.resourceChange - waste;
    }

    this._applyBuilder(spellId, this.getResource(event), gain, waste, event.timestamp);
  }
}

export default FocusTracker;
