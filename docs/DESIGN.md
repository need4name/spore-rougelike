# Primordia: design notes

## Pitch

Spore's arc from cell to space, rebuilt for phones: no movement, just decisions. Events happen *to* your lineage, and you answer them like event cards in Crusader Kings 3. Mutation drafts build a body, and parts can be merged into hybrids. Extinction ends the run, but Genetic Memory carries over and unlocks more variety.

## The run

| Stage | Turn unit | Phases | Status |
|---|---|---|---|
| Cell | Epoch | Single cell → **Many Become One** (multicellularity) → **The Edge of the Sea** (land or sea) | Playable |
| Creature | Generation | First Steps → **Age of Giants** (size choice) → **Spark of Mind** (Mind tree) → First Tribe / First Pod finale | Playable |
| Tribe, Civilization, Space | — | — | Planned |

**Each turn:** an event → an animated scene of your creature reacting → end of turn (Food gathered and eaten, Population growth, DNA, Insight) → a mutation draft, milestone or finale when DNA reaches one.

**A failed finale is a real failure:** you lose Population (and some DNA in the Cell stage), then can try again 3 turns later.

## Resources

- **Population**: your health. At 0 you are extinct.
- **Food**: you gather Food every turn based on your Instinct and parts, and eat half your Population (rounded up). Spare Food grows Population by 1 (once per turn). Storage is capped, and extra Food spoils. So Food turns into Population, and a bigger Population eats more.
- **DNA**: drives drafts, milestones and finales.
- **Insight** (after the Spark of Mind): flows into the innovation your kind is fascinated by, like CK3 cultural innovations. Innovations need the right diet, stats, traits or earlier ideas, and some rule others out (Ambush Instinct or Gentle Grazing; Pack Tactics or Herd Defense; War Bands or Shared Ritual; Lone Wanderers or a social path).

## Instinct (CK3-style focus)

Forage, Hunt, Breed, Explore or Lie low. Your Instinct sets your Food income and makes matching events more likely. You can change it at any time.

## Builds

- **Slots.** Cell has Mouth, Motion and Membrane, plus Senses and Organ once multicellular. Land creatures have Mouth, Senses, Front limbs, Hands, Hind limbs, Feet, Back, Skin and Tail. Sea creatures have Mouth, Senses, Front fins, Rear fins, Dorsal, Skin and Tail.
- **Merging.** Once multicellular (and always as a creature), a new part can merge with the one in its slot, keeping both sets of stats and keywords ("Venomous Fangs"). A slot holds at most two parts. A new part on a merged slot (from a draft or a random mutation) swaps out only one half, so a merged part stays merged.
- **Carry-over.** When you leave the Cell stage, every cell part grows into a creature part (Spikes become Back Spines, a Flagellum becomes Runner Legs or a Fluke). The archetype only fills essential slots that are still empty.
- **Size.** Small creatures live in herds 1.5× bigger and eat less each, but every blow kills more of them. Giants live in small herds, eat a lot and shrug off damage. Max Population also grows with each milestone. Event gains and losses scale with herd size.
- **Keywords:** Venom, Armor, Swift, Glow and Symbiont. Two parts give a stat bonus; three give a stronger bonus.
- **Tags:** grasping parts (hands, arms, tentacles, trunk, prehensile tail) unlock tool events and the Tools innovation. Upright legs free the hands and boost Insight.
- **Traits** come from events and milestones and last the whole run. Your diet when leaving the Cell stage gives a heritage trait.

## The world

Every stage has named species with roles (predator, prey, rival, neighbor) and an opinion of you. Each has a real body built from the same parts as yours: tap one in the World tab to see its portrait, stats compared with yours and its body. They wander through the scenes and appear in events. Allies feed you; hostile species attack. A giant predator arrives in the Age of Giants.

## Scenes

After every choice, a scene plays: your herd, the species involved, props from the event (ice, fire, fruit, tar, whirlpools, viruses and more) and a cartoon reaction (squash and stretch, hops, spins, comic words) with a facial expression (happy, sad, worried sweat, dizzy, angry, sleepy, in love).

## Between runs

- **Genetic Memory** = DNA ÷ 3 + milestone bonuses + 40 for winning, × Hostility bonus.
- **Unlocks:** archetypes, home worlds, mutation packs, ancestral boons and Hostility 1–5.
- **Codex of Life:** every event, part and ending found.
- **Endings:** Firekeepers, Unifiers, Conquerors and Wanderers (land); Deep Singers, Reef Builders and Tide Lords (sea).

## Next steps

1. Playtest the new pacing: about 50 turns per run.
2. More events per era and habitat, and event chains.
3. The Tribe stage, which starts from your ending.
