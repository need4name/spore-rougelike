# Primordia: design notes

## Pitch

Spore's arc from cell to space, rebuilt for phones: no movement, just decisions. Time flows on a living world map like Crusader Kings 3 (pause and three speeds), and events pop up and happen *to* your lineage. Mutation drafts build a body, parts merge into hybrids, and the right pairs evolve (like Ball x Pit). Extinction ends the run, but Genetic Memory and the Codex carry over and unlock more variety.

## The run

| Stage | Turn unit | Phases | Status |
|---|---|---|---|
| Cell | Epoch | Single cell → **Many Become One** (multicellularity) → **The Edge of the Sea** (land or sea) | Playable |
| Creature | Generation | First Steps → **Age of Giants** (size choice) → **Spark of Mind** (Mind tree) → First Tribe / First Pod finale | Playable |
| Tribe, Civilization, Space | — | — | Planned |

**Time:** every tick (2.4 s at normal speed) is one Epoch or Generation: Food is gathered and eaten, Population grows, DNA and Insight arrive, and every other species grows, starves or is hunted. Drafts, milestones and finales pause time when DNA reaches them. Random events also pop up and pause time; after choosing, a scene acts out what happened.

**A failed finale is a real failure:** you lose Population (and some DNA in the Cell stage), then can try again 3 turns later.

## Resources

- **Population**: your health. At 0 you are extinct.
- **Food**: you gather Food every turn based on your Instinct and parts, and eat half your Population (rounded up). Spare Food grows Population by 1 (once per turn). Storage is capped, and extra Food spoils. So Food turns into Population, and a bigger Population eats more.
- **DNA**: drives drafts, milestones and finales.
- **Insight** (after the Spark of Mind): flows into the idea your kind is fascinated by in the Mind skill tree. Each idea branches from earlier ones, shown with lines. Innovations need the right diet, stats, traits or earlier ideas, and some rule others out (Ambush Instinct or Gentle Grazing; Pack Tactics or Herd Defense; War Bands or Shared Ritual; Lone Wanderers or a social path).

## Instinct (CK3-style focus)

Forage, Hunt, Breed, Explore or Lie low. Your Instinct sets your Food income and makes matching events more likely. You can change it at any time.

## Builds

- **Slots.** Cell has Mouth, Motion and Membrane, plus Senses and Organ once multicellular. Land creatures have Mouth, Senses, Front limbs, Hands, Hind limbs, Feet, Back, Skin and Tail. Sea creatures have Mouth, Senses, Front fins, Rear fins, Dorsal, Skin and Tail.
- **Merging.** Once multicellular (and always as a creature), a new part can merge with the one in its slot, keeping both sets of stats and keywords ("Venomous Fangs"). A slot holds at most two parts. A new part on a merged slot (from a draft or a random mutation) swaps out only one half, so a merged part stays merged.
- **Evolutions.** 61 recipes (Ball x Pit style): merging the right two parts in a slot evolves them into one stronger part, which can merge again. Some tier 1 evolutions evolve again into tier 2 legendaries. Drafts name known recipes and hint at unknown ones. Discoveries are saved in the Codex (+5 Genetic Memory each) and gate unlocks: Venom Glands (1), Symbiote (2), Toxic Bloom (4), Parasite (5).
- **Carry-over.** When you leave the Cell stage, only your mouth and your evolved parts grow into creature parts. Everything else is left behind; the archetype fills essential empty slots.
- **Appearance.** In the Creature stage the Look tab changes body color, pattern color, pattern, body shape, neck, posture and eyes. Some options unlock with progress (two legs need Upright or Striding Legs; long necks need the Age of Giants on land). Looks never change stats.
- **Size.** Small creatures live in herds 1.5× bigger and eat less each, but every blow kills more of them. Giants live in small herds, eat a lot and shrug off damage. Max Population also grows with each milestone. Event gains and losses scale with herd size.
- **Keywords:** Venom, Armor, Swift, Glow and Symbiont. Two parts give a stat bonus; three give a stronger bonus.
- **Tags:** grasping parts (hands, arms, tentacles, trunk, prehensile tail) unlock tool events and the Tools innovation. Upright legs free the hands and boost Insight.
- **Traits** come from events and milestones and last the whole run. Your diet when leaving the Cell stage gives a heritage trait.

## The world

Every stage has named species with roles (predator, prey, rival, neighbor), an opinion of you and a population. Their herds roam the world map: crowd size shows population and sprite size shows body size. Predators chase prey, hostile species drift toward you, allies stay close. Populations rise and fall each tick; species can go extinct and newcomers arrive. Tap a herd (or a species in the World tab) to see its sheet, and tap its portrait to view it full screen. Hunting or beating a species thins its numbers.

## Scenes

After every choice, a scene acts out what happened. When another species is involved, both sides play a story: you chase and eat prey, win or lose a brawl, get mauled, escape while the predator looks confused, befriend them, or get snubbed. Babies pop into your herd when it grows; ghosts float up when it shrinks; food flies in or away. Props come from the event (ice, fire, fruit, tar, whirlpools, viruses and more), with cartoon faces and comic words.

## Between runs

- **Genetic Memory** = DNA ÷ 3 + milestone bonuses + 40 for winning, × Hostility bonus.
- **Unlocks:** archetypes, home worlds, mutation packs, ancestral boons and Hostility 1–5.
- **Codex of Life:** every event, part and ending found.
- **Endings:** Firekeepers, Unifiers, Conquerors and Wanderers (land); Deep Singers, Reef Builders and Tide Lords (sea).

## Next steps

1. Playtest the real-time pacing: about 75 ticks per run, about 30 in the Cell stage.
2. More events per era and habitat, and event chains.
3. The Tribe stage, which starts from your ending.
