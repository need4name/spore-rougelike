# Primordia: design notes

## Pitch

Spore's arc from cell to space, rebuilt for phones: no movement, just decisions. Each turn you take an action, then answer an event card in the style of Crusader Kings 3. Mutation drafts shape your body, and synergies between parts create builds. Extinction ends the run, but Genetic Memory carries over and unlocks more variety.

## The run

| Act | Turn unit | Status |
|---|---|---|
| Cell | Epoch | Playable |
| Creature | Generation | Playable |
| Tribe | Season | Planned |
| Civilization | Year | Planned |
| Space | Decade | Planned |

**Each turn:** action → event → outcome → upkeep (food eaten, +1 DNA from time passing) → a mutation draft if a DNA marker was passed → the stage finale when the bar is full.

**Resources:** Health (0 = extinction), Food (eaten every turn; you starve when it runs out), DNA (fills the evolution bar).

**Stats:** Strength, Toughness, Speed, Cunning and Charm. These come from parts, traits, synergies and your archetype. A check is rolled against a stat, and the chance of success is always shown on the button.

**Choices that need something:** some options only work with the right diet, keyword, part, trait or enough food. Locked options are shown greyed out with the reason, so players learn what to build for next time.

## Builds

- **Slots:** Cell has Mouth, Motion, Defense and Sense. Creature has Mouth, Limbs, Back, Senses and Skin. Your mouth sets your diet.
- **Keywords:** Venom, Armor, Swift, Glow and Symbiont. Two matching parts give a stat bonus. Three give an economy bonus.
- **Traits** come from event choices and last the whole run.
- **Heritage:** your diet at the end of the Cell stage gives a lineage trait, as in Spore.
- **Rivals** (Creature stage) are species with an opinion of you. Allies give food. Hostile species raid you.

## Between runs

- **Genetic Memory** = DNA earned ÷ 2, +10 for reaching land and +30 for winning, × Hostility multiplier.
- **Unlocks:** archetypes (Predator, Symbiote, Parasite), home worlds (Volcanic Vents, Frozen Sea, Toxic Bloom), mutation packs (Glow, Armor, Venom) and ancestral boons (Health, food, starting DNA, rerolls, a 4th draft option).
- **Hostility 1–5** unlocks after each win.
- **Codex of Life:** every event, part and ending you've found.

## Next steps

1. Playtest and tune: event variety, odds, food pressure.
2. More events per stage (target 40+), with chains that span stages.
3. Tribe stage: members, tools, neighbouring tribes. The creature-stage ending (Firekeepers, Unifiers, Conquerors) sets your starting bonus.
4. Sound, animations for the outcome of checks, and an offline-capable install.
