# Primordia: design notes

## Pitch

Spore's arc from a single cell to a civilization, rebuilt for phones: no movement, just decisions. Time flows on a living world map like Crusader Kings 3 (pause and three speeds), and events pop up and happen *to* your lineage. Mutation drafts build a body, parts merge into hybrids, and the right pairs evolve (like Ball x Pit). Extinction ends the run, but Genetic Memory and the Codex carry over and unlock more variety.

## The run

| Stage | Turn unit | Phases | Status |
|---|---|---|---|
| Cell | Epoch | Single cell → **Many Become One** (multicellularity) → **The Edge of the Sea** (land or sea) | Playable |
| Creature | Generation | First Steps → **Age of Giants** (size choice) → **Spark of Mind** (choose a Path of Mind) → your Path's finale | Playable |
| Tribe | Year | **Your first Fire, Song, Light, Queen or Harvest** → **Strangers** (a rival band) → **The Council of Elders** → **More Strangers** → **the Founding** (Settle, Roam or Conquer) | Playable for every Path (Updates 14–15) |
| Society, Empire | — | — | Planned (Empire is the final stage; see LATER_STAGES.md) |

**Time:** every tick (2.4 s at normal speed) is one Epoch or Generation: Food is gathered and eaten, Population grows, DNA and Insight arrive, and every other species grows, starves or is hunted. Drafts, milestones and finales pause time when DNA reaches them. Random events also pop up and pause time; after choosing, a scene acts out what happened.

**Odds** (Patch 15.1): `G.chance` = 50 + 45 × tanh((stat − difficulty) ÷ (3 + 0.3 × difficulty)), from 5% to 95%. Matching the difficulty is 50%; a few points short is still a gamble at any stage.

**Build-up** (Patch 15.1): before the outcome of a fight with another species, the two face off, the instigator pounces, and they brawl in a cloud of dust (2.1 s); friendly approaches get a short walk-up and solo checks a short tremble. The result text appears, and your numbers change, only when it is over.

**Body-plan parts** (Patch 15.1): parts can need a symmetry (`sym`), a number of leg pairs (`legs: [min, max]`) or arm pairs (`arms`). They are only offered when your body fits (`G.partFits`), and lie dormant (no stats, no keywords) if your body plan changes. Each symmetry has cell and creature parts and combinations; legless, one-pair, two-pair, many-pair and armed bodies have their own. The Body plan tab lists what your plan opens.

**Eyes** come only from eye parts (`G.EYES`): none means no eyes; the best eye part sets how many.

**A failed finale is a real failure:** you lose Population (and some DNA in the Cell stage), then can try again 3 turns later.

## Resources

- **Population**: your health. At 0 you are extinct. Since Patch 15.1 it is counted in individuals (`G.POP_SCALE` = 10 per "head"): maximums are in the hundreds, broods add about ten young for each lot of spare Food, and starving costs ten for each Food short. Event gains and losses are written in heads and scale with your herd; some give or take a share instead (`popPct` of what you have, `popMaxPct` of your maximum) or a fixed number (`popFlat`). Old saves are converted when loaded (`G.migratePop`).
- **Meat and plants** (Patch 15.1): two stores (`run.meat`, `run.plants`; `run.food` is the total you can eat). Herbivores eat plants, carnivores meat, omnivores either (meat first). Foraging brings plants (carrion for carnivores) and hunting brings meat (for herbivores, plants); events give meat for hunts and carcasses, plants for fruit, blooms and kelp, otherwise what you eat. Meat feeds 1.5 (`G.MEAT_NOURISH`) but a fifth of it rots every turn (`G.MEAT_ROT`); plants keep. Storage caps the total.
- **Food**: you gather Food every turn based on your Instinct and parts, and eat half your Population (rounded up). Spare Food grows Population by 1 (once per turn). Storage is capped, and extra Food spoils. So Food turns into Population, and a bigger Population eats more.
- **DNA**: drives drafts, milestones and finales.
- **Insight** (after the Spark of Mind, about halfway through the Creature stage; finishing the tree takes the other half): flows into the idea your kind is researching in its Mind tree.
- **Paths of Mind (Update 13).** At the Spark of Mind you choose one of five Paths: Toolmakers, Singers, Many Minds, the Swarm or Gardeners. Your body and history open some and lock others (`G.openPaths`; every body gets at least two). The Path is fixed for the run.
- **The Mind tree is built from pieces** (`G.INNOVATIONS`), and each lineage sees only its own:
  - **Roots** (row 1): three ideas from your temperament, set by your starting archetype (`G.TEMPERAMENTS`: the Hunter, the Herd, the Bond, the Taker, the Many, the Mask, the Wanderer).
  - **Home** (row 2): three land or sea ideas, plus one from your biome (land) or depth (sea).
  - **Path** (rows 3–4): four ideas from your Path.
  - **Awakening** (row 5): your Path's capstone. Researching it brings your Path's finale (`finale_<path>_<land|sea>`).
- **Endings.** Ten main endings, one for each Path on land and at sea (`G.ENDING_FOR`), each named differently by your temperament: 70 in all (for example, the Hunter's Many Minds sea ending is the Lantern Court). They decide which kind of people you become in the Tribe stage. The **Codex of Endings** tracks every pair of start and ending you have reached; each new one is worth +10 Genetic Memory.
- **Signature events:** two for each Path, shown only on that Path.

## The Tribe stage (Update 14)

- **Who gets one.** Every lineage that wins its Creature finale becomes a people (`G.TRIBE_PATHS`, `becomeTribe`), and its Path decides the kind (`G.KINDS`): Toolmakers a **Tribe** or **Shell Clan** (Fire), Singers a **Choir** or **Pod** (Song), Many Minds a **Den** or **Deep Den** (Light), the Swarm a **Hive** or **Reef-colony** (Brood), and Gardeners a **Grove** or **Kelp Garden** (Growth).
- **Checkpoint.** The Creature ending pays out at once (`checkpoint`: the usual win Genetic Memory, the Codex of Endings square and a win), so dying in the Tribe stage never costs it. The Tribe stage then pays its own Genetic Memory at the end: Ideas ÷ 3, +5 and +2 per discovery (up to +10), +25 for the Founding, +10 for a new Tribe ending.
- **Your body stays.** Parts, body plan and look carry over and no longer change. They give your stats and your **talents** (`G.talents`: hands, voice, glow, venom, armor, wings, eyes, speed), which open talent discoveries.
- **Ideas replace DNA** (`G.ideasPerTurn`: 1 + Ideas bonuses + Cunning ÷ 10, +1 exploring). Rich Genes and your home world don't boost them. Goals: discoveries at 5, 13, 22, 32, 43, 55, 68, 82, 97 and 112; Strangers at 34; the Council of Elders at 70; the Founding at 120. A Tribe stage takes about 20–45 years.
- **Discoveries** (`G.DISCOVERIES`, 51) are drafted 1 of 3 like parts: shared ones, talent ones, Path ones and land or sea ones. The right pairs **combine** (`from`) into a greater discovery; you keep only the result. New combinations go into the Codex (+3 Genetic Memory).
- **Leaders** have a name and two traits (`G.LEADER_TRAITS`) that change your stats. A leader lives 14–25 years; when one dies (old age, a challenge, an event), you choose the next from three candidates (the `succession` event).
- **Fire** (Toolmakers): from the first milestone your Fire (or Vent-heat) grows by 1 a turn, up to 20. At 3 or more it cancels cold seasons and cuts attacks by 25%. **Craft** spends 4 for a level of gear (+1 Strength per level, +1 Toughness every second level, up to 5).
- **Song** (Singers): every 6 Song gives +1 Charm (up to 3) and every 10 gives +1 Idea a turn. When 3 or more members die at once, Song is lost, and if too little is left, a discovery is forgotten. **Teach the songs** protects you from the next such loss.
- **Light** (Many Minds): the Den has half the members, but +2 Cunning. At 3 Light or more it hides (attacks 25% rarer). **Watch and learn** copies a rival band's discovery (or gives Ideas and Light), and migrating costs nothing.
- **Brood** (the Swarm): a Queen instead of a leader (she lives 8 years longer). **Castes** (`G.CASTES`, changeable every 6 turns): workers (+2 Food), soldiers (+2 Strength, +1 Toughness) or nurses (+3 members, +1 Brood). At 8 Brood a member hatches (−6 Brood). **Grow your home** spends 5 Brood for a level (up to 6): +2 members each, and +1 Toughness every second level.
- **Growth** (Gardeners): every 4 Growth gives +1 Food a turn (up to 4), and tamed species feed twice as well and guard the gardens (each makes attacks 10% rarer, up to 3). At 8 Growth or more, **Blight** can strike (3% a turn, +1% per Growth over 8), halving Growth and costing 3 Food. **Tend the gardens** keeps it away for 12 turns.
- **Temperaments** carry on (`G.TRIBE_TEMPER`): Hunters hunt 1.5× and bands fear them; the Herd and the Many are bigger; the Bond tames more easily; the Taker steals a discovery when it beats a band in war; the Mask courts with Cunning; the Wanderer migrates a turn faster and learns 3 Ideas on the way.
- **Wildlife.** The species of your Creature world stay. **Tame** one (Charm, up to 10 turns) for +1 Food a turn (up to 3) and it never attacks you; **Revere** one as your totem for +1 to its best stat. **Ceremony** (every 8 turns) gives Fire or Song and Ideas.
- **Strangers.** At the Strangers milestone your nemesis (or worst rival) learns to think and becomes a rival band; at More Strangers (88 Ideas) a second band arrives. Each band thinks in its own way (a hive, a choir, a den...), and two bands can feud. Bands slowly sour on you unless you are allies, raid your camp once they dislike you, grow stronger with the years, and remember the old feud.
- **The Founding** (`founding_<path>_<land|sea>`): three choices, each its own ending (`G.TRIBE_ENDINGS`): Settle (Toughness), Roam (Speed) or Conquer (Strength). 30 Tribe endings in all, in the Codex.
- **A new stage is hard.** Every Tribe-stage check is harder by `G.TRIBE_HARSH` (5). The wild and rival bands keep pace with a strong people: a hunter's attack is never more than `G.TRIBE_THREAT` (2) below your defence, bands match your Strength, strikes land up to 60% of years and each costs 1 more member (`G.TRIBE_BLOW`), after a 5-year grace (`G.TRIBE_GRACE`). A people raises one child a year, for 2 more Food (`G.TRIBE_CHILD_COST`). Bands lose 2 opinion a year (1 for Singers with 6 Song), raid you below 20, and are harder to court (−15%, +7 a success). Test bots with a fully upgraded body win about 60% of first Tribes, and every Tribe with Ancestral Wisdom maxed.
- **Ancestral Wisdom** (`G.WISDOM`, Update 15): a second tree on the Evolution screen, open once you have reached the Tribe stage, whose upgrades only work there: Old Stories (+6 starting Ideas), Strong Blood (+2 members), Born Keepers (+3 starting resource), Elders' Counsel (checks 1 easier per level, up to 3), Peacemakers (bands 20 friendlier), Watchfires (attacks 15% rarer), Wise Choosing (4 candidates, longer lives), Hardy Folk (+1 Toughness), Remembered Ways (a starting discovery), the Founders' Path (Founding 2 easier), Kinship (taming and courting +15%) and Last Stand (survive once). Its levels are stored with the Evolution Tree's but don't count toward the hidden power.
- **Stage Select.** The start of each Tribe you reach is saved (`meta.stageStarts`, one per kind). A new run can begin there for free from the new lineage screen.
- **Balance (test bots):** fully upgraded bots win nearly every Tribe they reach (their Creature win rate is 85–100%); weak, unupgraded bodies often die in the Tribe stage. Rival bands keep pace with your own Strength, so ignoring a hostile band costs members every year; courting or beating it stops the raids.
- **Tribe words** for events: {band}, {Band}, {resource}, {keeper}, {camp}, {leader}, and {cand0}–{cand2}.

## The Society stage (Update 16)

- **Who gets one.** Toolmakers and Singers (`G.SOCIETY_PATHS`) that win the Founding become a society (`becomeSociety`): the **Hearthlands** or **Vent Holds** (Toolmakers) and the **Song-circles** or **Pod League** (Singers) (`G.SOCIETY_KINDS`). The other kinds follow in Update 17; for now their Founding still ends the run.
- **Checkpoint.** The Founding pays out at once (`stageCheckpoint`, the same reward as winning the Tribe stage), so dying in the Society stage never costs it. Stage Select saves the start of each Society too (key `path|hab|society`). The Society stage pays at the end: Influence ÷ 3, +5 and +2 per settlement and +1 per tradition (up to +15), +25 for the Union, +10 for a new Society ending.
- **Your Founding decides your kind of society** (`G.SOCIETY_TYPES`): **Settled** (+1 Food, +1 Toughness, 4 settlements, building costs a turn less), **Roaming** (+1 Speed, +2 exploring, 2 settlements, migrating a turn faster, with +3 Influence each time) or **Warlike** (+2 Strength, 3 settlements, +4 Influence per victory, +5 from raids).
- **Influence replaces Ideas** (`G.influencePerTurn`: 1 per 6 settlement sizes, + Influence bonuses + Ideas bonuses ÷ 3, +1 exploring). Goals: traditions at 8, 20, 34, 50, 68, 88, 110, 135 and 160; the Council at 45; the Gathering of Peoples at 95; the Union at 190. A Society stage takes about 35–50 generations.
- **Settlements.** 2–4 to start (the capital at size 2), up to 8, each up to size 4. Max people = 4 + 5 per size (then scaled by body size). Each settlement farms +1 Food a turn and raises a brood of young a turn. **Found a settlement** (3 turns, 6 Food and a fifth of your people) and **Build up a settlement** (2 turns, 4 of your resource or 6 Food) are Activities. The capital is drawn by your people on the map; the others spread across the region with their names.
- **The ruler and the council.** A Steward (+1 Food, +3 storage), a Marshal (+1 Strength, +1 Toughness) and a Keeper (+1 Influence), each with a trait and a loyalty (−100 to 100). Loyalty drifts down 1–2 a generation (kind rulers and Council of All slow it, cruel rulers speed it); below −30 a councillor withholds their help, and below −25 they may start a **plot** (`council_plot`: dismiss, buy off, strike first or turn their allies; failing means a **coup**: a new, cruel ruler and 10% of your people lost). When the ruler dies, the council chooses from the three councillors or an heir (`soc_succession`); a chosen councillor is replaced.
- **Traditions and Laws** (`G.TRADITIONS`, 28) are drafted 1 of 3. Tier I from the start, tier II from 2 traditions, tier III from 4. Opposed pairs rule each other out (War Bands or Peace Vows, Open or Closed Gates, Elders or Young Blood, Old Ways or Reason, Hearth Law or Road Law). Some are for one Path, habitat or kind of society; some carry rules (`G.hasFlag`): peaceful (neighbours don't sour), open (trade +1 Food), closed (attacks 20% rarer), guests and messengers (gifts and courting work better), loyal (the council stays loyal), songSafe (no discovery lost to a great loss). Your **founding myth** gives +1 Charm. Discoveries from the Tribe stage carry on working.
- **Neighbour peoples.** Your old rival bands stay (their grudges softened to −20, or −40 for a nemesis) and new peoples join them until there are three. They lose 1 opinion a generation (none if you are peaceful or Singers with 6 Song), raid only below −10 (`G.SOC_RAID_BELOW`), and share up to +2 Food a turn once allied (60+). **Send gifts** (3 Food, +15 opinion), **Trade** (opinion 10+: +1 Food and +1 Influence a turn) and **Raid** (Strength against theirs: food and Influence, −25 opinion) are Activities.
- **Events** (41): three milestones (the First Generation, the Council Meets, the Gathering of Peoples), the plot and succession chains, 21 for any society, two for kinds of society, four for Toolmakers and five for Singers. New effects: `loyalty`, `plotEnds`, `settlementLoss`, `settlementGrow`, `newSettlement`, `neighbourOpinion`, `tradition`, `mods` (lasting) and `societyEnding`; new requirements: `socType`, `settlements`, `neighbour`.
- **The Union** (`union_<path>_<land|sea>`): unite the region by force (Strength), trade (Charm) or faith (Cunning), each its own ending (`G.SOCIETY_ENDINGS`, 12 in all, in the Codex). The Wonder ending comes in Update 17.
- **Difficulty.** Society events are a little harder than Tribe ones (+2 base), plus `G.SOC_HARSH` (3). Test bots with fully upgraded lineages win about 65–80% of Societies; weak, unupgraded ones mostly fall to raids and hunters early. There is no Society upgrade tree yet (Heritage comes in Update 17).
- **Society words** for events: {people}, {settlement}, {settlements}, {capital}, {ruler}, {myth}, {plotter}, and {cand0}–{cand3}.

## Update 21: The Colonial Age

- **A new stage** (`G.STAGES.colonial`, evolveAt 300, eleven technology goals, milestones `colonial_dawn`, `the_succession`, `the_great_rebellion`). A won Age of Sail calls `becomeColonial` (checkpoint, then `colonialStart`). `G.civ` includes it; `G.nations(run)` (Renaissance and Colonial) runs nations, souring and invasions; `G.STAGE_INHERIT` lets later stages draw earlier civilisation events and activities. Prestige is `run.dna` (`G.dnaWord`), its per-turn sources are Influence's plus `floor(colony sizes / 2)`. `G.REALM_NAMES`, `G.realmName`; `G.COL_HARSH` 9.
- **Colonies** (`run.colonies`: name, how settle/trade/conquer, size 1–4, unrest 0–100): founded by `colonize` (−8 Food, −6 resource, max 6), `subjugate` (a war against an overseas people; Disposition not Peaceful) or the `colony` event effect. Unrest per turn `G.colonyUnrestRate` (settle 1.6, trade 1, conquer 4, ×(1 + 0.15·size), Loyal Governors −⅓ per level, `calm_colonies` ×0.6); growth +1 size every 8 turns while unrest < 50; at 100 a colony rebels: −8% people, −10 Prestige, and its rebels become a warlike overseas nation (−60 opinion). `royal_tour` −25 unrest everywhere. Colonies give Food (`G.income`, 1 each); trading posts (`trade_post`) +1 resource a turn each (`G.specialGain`).
- **Dynasty:** `run.heir` (`newHeir`, Royal Nurseries add good traits). On a ruler's death `succeed` crowns the heir and names a new one; without `heir_sure` (Primogeniture) councillors lose 8 loyalty and a War of Succession can strike (45%, 20% with `heir_chosen`): −12% people, +15 unrest. `heir_chosen` (Elective Crown) adds a good trait. Effects `heirTrait`, `newHeir`.
- **Overseas peoples** (`makeOverseas`): two bands with `overseas`, `nation`; opinion and Disposition from the Age of Sail road (explore 0 guard, trade +20 peace, conquer −30 war).
- **The Crown tree** (`G.CROWN`, `G.CROWN_ID`, `run.crown`): bands inherit (`road`), people (Path; land/sea names), tech (Prestige drafts into `run.crownGrafts`; tiers II/III need 2/5; some `disposition`), law (`excl` forks; rules `heir_sure`, `heir_chosen`, `calm_colonies`), dynasty (`when.deed`, `G.CROWN_DEEDS`, `G.addCrownDeed`), gate (`crown_gate`: Prestige goal and `G.crownNeed()` = 13 − 2 per Ancient Regalia), beyond (per Disposition, `req.known` 12, `inherit`). Costs as Reason (tech 7/10/13; inherit 6, people 8 (+3), law 8, dynasty 10, gate 18, beyond 30; Royal Academies −10%/level; ×(1 + 0.08 × known)). The Disposition can shift again until `crown_gate` fixes it.
- **The finale** `crown_finale`: federation (Peaceful/Territorial, Charm), dominion (any, Cunning), conquest (Territorial/Warmongering, Strength); `G.COLONIAL_ENDINGS`, codex `path|road` in `colonialEndings`.
- **Charters** (`G.CHARTERS`, 12, `c_` ids, `G.chartersOpen`), mods via `colonialMods` (which also applies Reason Beyond `inherit`).
- **Balance** (fully upgraded earlier stages): 29 of 34 Colonial Ages won without Charters, 32 of 34 with one level of each; losses to invasions and raids.
- **UI:** Realm, Council, Crown, Book (Crown page with the dynasty), Reason, Law, Lore tabs; heir and colonies in the Realm tab; a ⛵ colonies chip (red when one is close to rebellion); gate prompt "Claim the Imperial Crown".

## Patch 21.4: Primordia as an app

- **Installable:** `manifest.webmanifest` (standalone, portrait, dark theme) and icons in `icons/` (a 180 px Apple touch icon, 192 and 512 px icons, and a maskable 512 px icon). `index.html` links both.
- **Offline:** `sw.js` registers only on the hosted game (https or localhost, never from a file or inside the artifact). On install it saves every file of the current release; each file's address carries the release (`?v=21.4`), so a saved copy is always the right one. The page itself is network-first with a 4-second fallback to the saved copy, so a phone with a connection always gets the newest release. Fonts are served from a saved copy and refreshed in the background. Old releases' caches are deleted when a new worker takes over; saves are in localStorage and are never touched.
- **Releases:** `python3 tools/stamp.py <version>` stamps the version on index.html (file addresses and the build check), on each script's build stamp and on `sw.js`. A changed `sw.js` makes browsers install the new release.
- **Moving a save:** Safari and a home-screen app keep separate storage on iOS. `G.exportSave` writes meta and the current run as a `PRIMORDIA1:` code (base64 JSON); `G.importSave` checks it, writes it to storage and the page reloads. Options can copy the code (or show it to copy by hand), paste one, save it as a .txt file, or load a file. Loading asks before it replaces everything.
- **Install hint:** the title screen suggests Add to Home Screen on iPhone and iPad (or shows Install where the browser offers it) until the game runs as an app or the player taps Not now. It only appears on the hosted game, which has a manifest.

## Patch 21.3: First Steps (the guide)

- **A guide for the first lineage.** `G.GUIDE` (world.js) is an ordered list of steps. Each one has a moment (`when`), the steps it comes `after`, and a `target` on screen. The bubble sits above or below the target, and the target is lit with an outline and a dark surround (`.guide-target`). Steps that sit over an event or draft use `light` (outline only) so the choices stay readable.
- **Reading steps** (`hold`) stop the clock and wait for Next. **Doing steps** (`done`) wait for the player to do the thing, such as tapping Instinct, pressing play or picking an answer. On the map, `pause` makes a doing step stop the clock too. A step that was just shown counts as done once you do it, even if doing it changed the screen.
- **What it covers:** the map, Population, Food, DNA, Instinct (a Drifter is told the current chooses), play, the first event, the first mutation, the body sheet and its tabs, the loop, becoming multicellular, the Creature stage, extinction and the Evolution Tree.
- **It replaces the matching first-time tips** (welcome, instinct, event, draft, multicellular, creature, extinct, tree). They are marked seen as each step finishes, and other tips wait while a step is on screen.
- **Who sees it:** new players (`meta.guide.on`). Anyone with a finished lineage starts with it off. Options has a Guide switch and "Replay the guide from the start". "Skip the guide" turns it off and hands back to the ordinary tips. A guided new lineage starts paused, so the player can press play themselves.

## Patch 21.2: A clearer Fossil Record

- **Lineages have names.** `run.lineage = { id, name }` is set by `G.newRun` (typed on the setup screen, or two random syllables from `G.LINEAGE_SYLLABLES`). Fossils, Stage Select starts and history entries copy it; revived runs keep it. Older fossils each become their own lineage named after their archetype. `G.renameLineage` renames every copy at once (max 24 letters).
- **The Fossil Record groups fossils by lineage**, furthest point first, each with a detail line (`G.fossilDetail`: land or sea, diet, Path, numbers, parts).
- **Delete:** `G.deleteFossil` removes any fossil, in amber or not, after a second tap. With amber full, the other fossils say "Amber full" and the note explains how to make room.

## Patch 21.1: Early-game polish

- **Tribe blows are capped.** Sims of 170 Tribe runs per setting showed raids and hunts on the map caused almost every Tribe loss: about one hit a turn, often a quarter to half of the people at once. In the Tribe stage one blow now takes at most `G.TRIBE_HIT_SHARE` (20%) of your members, plus 2% per point of the blow, never less than one Population head. Founding now succeeds 95–100% on every Path with an empty Evolution Tree (it was 25% for Song, 100% for Many). Ancestral Wisdom still makes it faster.
- **The Spreading Fever** takes a share of your members (8% if you scatter, 5% if you drive the sick away) instead of a flat 40 or 15, which could empty a small Tribe.
- **Offers your diet can't use are rarer.** In drafts, a part that `G.useless` flags gets 0.2× weight. Mouths are exempt, since a mouth changes your diet.
- **Honest descriptions.** Texts that named a fixed head count (Armor tier 3, Strong Blood, Frozen Sea, Toxic, the egg-laying and mid-sized hints) now describe the effect, because the real amount scales with body size.

## Patch 20.3: Things do what they say

- **Learning from tabs any time:** `G.learnLore`/`learnLaw`/`learnReason` work in any phase but `end`; `holdScreen`/`resumeScreen` keep a waiting draft, event or scene and add a "Learned:" notice. Modal and sheet re-renders keep their scroll when `G.ui.keepScroll`.
- **Editor:** opens by itself once ever (`meta.editorShown`, derived from history for old saves). Colony Width (`bodyLen`) and Height (`bodyHeight`) scale separately (`sx`, `sy` in `drawColonial`).
- **Map zoom:** `G.mapZoom(run)` = 1 / 0.86 / 0.74 by `G.vision` in the Creature stage; `drawNeighbourStrips` paints the two neighbouring biomes; the world is drawn scaled about (w/2, 0.55h); taps and labels map through `mapView`.
- **Top bar:** population without "/max"; `speedControls` = play/pause (`speed-toggle`) + pace (`speed-cycle`, `G.ui.lastSpeed`) beside Instinct.
- **Nodes:** Mind ideas glow only when `innovationCost ≤ insight`; shop nodes only when affordable (`cant` otherwise).
- **Effects audit:** exploreBonus counts in Influence/Learning and Ideas (`ceil(bonus/2)`); dnaPerTurn feeds Ideas and Influence; ideasPerTurn carries into Influence at `trunc(/2)`; `G.income` floors gathering at 0 before adding foodPerTurn; cold blood in Tundra/Polar counted once; describeMods shows regrowth in individuals, Grazer ×1.6 and Parasite/Predator caps; hint texts fixed.
- **Population and food** (from a 1,728-run study, report in the user's docs): tribe resource upkeep `floor(max(0, heads − 30) / 20)`; Swarm hatching at `SPECIAL_SOFT` and below 80% of cap, cost 5; free regrowth at half strength, only below the cap and not after a hungry turn (`run.lastHungry`); crowding sickness 20% and one brood a turn while crowded; Grazer crew heads/3; Omnivore forage +1; Giant eatDiv 1.75; Small damageMult 1.3; settlements give Food equal to their size. Results: beginners reach the Creature stage 70/74/94% on runs 1–3, Society 57/68 without Heritage, Renaissance 32/34 without Patronage.

## Patch 20.2: A calmer screen

- **Top bar:** shorter title (stage name, turn, biome), diet badge, icon-only Disposition; leader chip only when there is no leader or they have 3 or fewer years left; council chip only when restless or plotting; no season or settlement chips; smaller portrait and buttons (`#app[data-screen="game"]` overrides at the end of style.css). The per-turn ledger over the map is gone; one notice shows at a time.
- **Odds:** `G.oddsWord(chance)` (Almost certain ≥90, Very likely ≥70, Likely ≥55, Even odds ≥45, Unlikely ≥30, Very unlikely ≥12, else Almost hopeless). "Certain" only shows next to a risky option. `G.meta.options.numbers` (`G.showNumbers()`) brings back percentages, "your X vs their Y" and the mutation compare box.
- **Options screen** (`optionsScreen`, `opt`/`opt-theme` actions): Detailed numbers, Tips, colour themes (`G.THEMES`, `:root[data-theme=…]` variables, `G.applyTheme`).
- **Trees:** nodes are opaque and above the edges; `nodeName` shrinks long words (`n-s`, `n-xs`); Mind tree "any of" ideas draw lines only from known parents (or the nearest one); the detail card is `position: sticky; bottom: 0`. `G.innovationVisible` hides ideas whose `req.innovation`/`req.some` can't be reached (not in the tree, or ruled out by a fork); `G.loreVisible` does the same for `req.some`.
- **Setup:** only unlocked archetypes and home worlds, compact cards (rule shown for the chosen one), Stage Select in a `<details>`, the Begin button `position: fixed`.
- **Upgrade fixes:** Hardy/Pantry read live in `G.maxPop`/`G.foodCap` (Hardy also adds to a civilisation's base); Rich Genes keeps `run.dnaFrac`; `damage` turns armour past the 1-point floor into −20% per point (up to 3); `costRound` (halves round down) for Lore, Law and Reason costs, and Lorekeepers no longer cheapens Law or Reason; Kinship/taming cap 95; Peacemakers clamp 100; Old Fortunes adds directly; Stage Select no longer repeats Old Fortunes or Envoys; Wisdom stat upgrades apply in the Tribe stage only; The Founders' Path eases the Founding only; descriptions fixed for Founding Stones (two per level), Deep Memory and Hardy. `startNote` in the shop for stage-start upgrades bought mid-stage.
- **Beginner's grace:** `G.beginnerGrace(run)`: Cell stage harshness −2 until `meta.stats.creatures` ≥ 1, −1 until 3 (counted when a lineage reaches the Creature stage; old saves derive it from history). Campaign bots (50% best choice) reach the Creature stage 60% / 68% / 78% on runs 1–3 (was 43% / 53% / 73%).

## Patch 20.1: Matching files and Gate prompts

- **Every release must bump the build stamp** in all seven places: the `?v=` on each `<link>`/`<script>` in index.html, `want` in index.html's inline check, and the `PRIMORDIA_FILES` line at the end of each JS file. The query strings make phones fetch new files together; the inline check reloads once if the files still disagree, then shows a tap-to-reload banner. (A phone running new rules with an old ui.js had no Law tab and could never adopt the Union.)
- **Gate prompts:** `G.gateFor(run)` (Tribe: Founding in Lore, Society: Union in Law, Renaissance: Age of Sail in Reason). Once the stage's goal is met and the Gate isn't known, the top bar's progress line says "Adopt the Union ›" and opens that tab, and a one-time notice says what is still needed (`run.gateNoticed`).

## Update 20: The Renaissance

- **A new stage** (`G.STAGES.renaissance`, evolveAt 250, ten invention goals, milestones `renaissance_dawn`, `the_schism`, `the_great_fair`). A won Union calls `becomeRenaissance` (a Genetic Memory checkpoint, then `renaissanceStart`). `G.civ(run)` is true for Society and Renaissance (settlements, council, neighbours, Society events and activities carry over); `G.people` covers Tribe, Society and Renaissance. Learning is `run.dna`; its per-turn mod is still `influencePerTurn`. Your nation's name: `G.NATION_NAMES`, `G.nationName`.
- **Nations** (`makeNations`, once per run): every neighbour people gets `nation` and `nationDisp` (peace/guard/war) from half its old opinion − 10, plus its grudge, ±your Disposition (Warmongers −15, Peaceful +5); Ambassadors add opinion. `nationsTurn` each generation: nations sour by `G.NATION_SOUR` (league members don't), turn warlike at −25 opinion and calm down at 45/70; a warlike nation below 0 opinion without a treaty or league may invade (`G.INVASION` 0.12 + 0.02 × (their army − yours) + generation/120). Your army: Strength + Toughness/2 + damage reduction; theirs: their Strength + `G.wildEdge` + generation/6. Hold (55% ± 6% per point, +15% per league ally): +3 Learning and the war deed. Lose: −10% people and they take your smallest city (never the capital while another stands); losing the last city ends the run ("conquered"). Nation raids hit 2 harder after the grace years.
- **The Reason tree** (`G.REASON`, `G.REASON_ID`, `run.reason`): bands `inherit` (`road` = your Society ending), `people` (your Path), `invention` (grafted by Learning drafts into `run.reasonGrafts`; tiers II/III need 2/5 known; some carry `disposition`), `movement` (`excl` forks), `faith` (`schism` from The Schism: reform, hold or tolerate), `deed` (`when.deed`, `G.REN_DEEDS`, `G.addRenDeed`: patron, voyage, league, war, masterpiece, plague), `gate` (`sail_gate`: the Learning goal and `G.sailNeed()` = `G.SAIL_NEED` 13 − 2 per Charts level) and `beyond` (one per Disposition, `req.known` 12, `inherit`). `G.reasonVisible`, `G.reasonAvailable`, `G.reasonKnown`, `G.reasonCost`, `G.learnReason`, `reasonOptions`.
- **Costs:** inventions 7/10/13 by tier; inheritance 6, people 7 (+3 tier II), movement and faith 8, deed 10, gate 16, beyond 28; the discovery percentage minus Natural Philosophers (10% per level); ×(1 + 0.08 × ideas known) except the gate; Visionaries −15% per level on Beyond.
- **Disposition shifts again:** `renaissanceStart` moves the Union's `run.disposition` to `run.unionDisposition` and clears it, so Reason leanings can change it until `sail_gate` fixes it again. The Age of Sail finale (`sail_finale`): explore (any), trade (Peaceful/Territorial), conquer (Territorial/Warmongering); a failed attempt costs 12% of your people. `G.RENAISSANCE_ENDINGS`, codex key `path|road` in `renaissanceEndings`.
- **Scholars:** Learning past the Age of Sail goal pays +1 resource per 25 surplus (at most 4) a turn (`G.scholarGain`), so a nation short of ideas is never stuck.
- **Activities:** `patronize` (5 resource, +2 Learning a turn for 3 turns), `voyage` (−4 Food, +6 Learning), `league` (an ally at 60+: treaty, league, no souring).
- **Patronage** (`G.PATRONAGE`, 12, `p_` ids, `G.patronageOpen`); `mods` apply via `renaissanceMods`, which also adds Reason mods and Law Beyond `inherit`. Heritage `mods` now apply only in the Society stage.
- **Balance** (strong bots, fully upgraded Creature stage and Heritage): 79% of Renaissances won without Patronage, 100% with one level of each. Nations are lost to invasions, mostly by peoples with low Strength.
- **The Book's Reason page** is `run.book.reason`, frozen at the Age of Sail. Stage Select saves the Renaissance's dawn.

## Update 19: Faith and Neighbours

- **All five kinds reach the Society stage** (`G.SOCIETY_PATHS`): Lantern Dens / Shadow Reefs, Mound Realm / Reef Dominion, Grove Commons / Kelp Realms (`G.SOCIETY_KINDS`, `G.SOCIETY_ENDINGS`, `union_<path>_<hab>`), with two path traditions and two Society events each.
- **The Law tree:** traditions with a `law` band: `founding` (your society type's two plus the Founding Myth), `law` (the old traditions; grafted by Influence drafts into `run.lawGrafts`; tiers II/III need 2/4 Law ideas; `excl` pairs are forks), `council` (`role`: open while that councillor's loyalty is above −30), `faith` (`faith` kind; tier II needs a faith idea), `culture` and `neighbours` (`when.deed`, `G.SOC_DEEDS`, `G.addSocDeed`), `gate` (`union_gate`: Influence goal and `G.UNION_NEED` 12 Law ideas, minus 2 per Union Stones level) and `beyond` (one per Disposition, `req.known` 11). `G.lawVisible`, `G.lawAvailable`, `G.lawKnown`, `G.learnLaw`. Known ideas are `run.traditions`, so flags (`G.hasFlag`) work as before.
- **Costs** (`G.lawCost`): Law tiers 6/9/12, founding 6, council 8, faith 8 (+2 tier II), culture/neighbours 10, gate 15, beyond 26; the discovery percentage (minus Lawgivers 10% per level); ×(1 + 0.06 × Law ideas held), except the gate; Old Empires −15% per level on Beyond.
- **The resource in a Society** is always on (`specialOn`), gains `G.specialGain` = 2 + specialPerTurn + total settlement size / 6, and its upkeep is settlements / 4 (not members / 20).
- **Faith** (`makeFaith`, `run.faith`): totem if you had one; else the species with the worst grudge or a nemesis; else your ancestors (`G.FAITH_KINDS`).
- **Society deeds:** a settlement at size 4, founding a settlement, a raid or war won, trade, a plot ended without a coup, the whole council at 40+ loyalty, a treaty, a marriage, a neighbour at 60+, a broken treaty.
- **Diplomacy:** Activities `treaty` (opinion 40+: `s.treaty`, they never raid you; raiding them breaks it: −35 opinion, −15 with every other neighbour, `betrayed` in their memory) and `marry` (opinion 25+: +25, +5 with their friends). The Memory of Kinds records treaty, married and betrayed.
- **Disposition** (`G.disposition`): the largest of your leanings (ties go Territorial), fixed in `run.disposition` when the Union is adopted. Union options carry `req.disposition` (force: Territorial or Warmongering; trade: Peaceful or Territorial; faith: any); options closed to you are hidden, like diet. A badge beside the diet badge, with an explain panel.
- **Heritage** (`G.HERITAGE`, 12, `h_` ids, opens with `G.heritageOpen`): Old Records, Old Cities, Lawgivers, Faithful Councils, Envoys, City Walls, Diplomats, Standing Armies, Many Laws, Union Stones, Deep Faith, Old Empires; `mods` apply via `societyMods`.
- **Harder Society:** `G.SOC_HARSH` 6 (was 3), neighbours raid below 0 opinion (was −10). Society bots with a fully upgraded Creature stage: 75% wins without Heritage, 99% with one level of each, 100% fully upgraded.
- **The Book's Law page** is `run.book.law`, frozen when the Union is adopted.

## Update 18: The Lore Tree

- **Lore ideas are discoveries** (`G.DISCOVERIES`) with a `lore` band: `trunk` (your Path's discoveries, always there), `graft` (anyone or talent discoveries, in the tree once chosen: `run.grafts`), `combo` (visible when both halves are in the tree, learnable when both are known; both halves are kept), `way` (`when.bg`: open while a leader with that background leads), `legacy` (`when.amb`: grafted by a fulfilled ambition), `deed` (`when.deed`: grafted by `G.addDeed`), `gate` (`founding_gate`) and `beyond` (2 per Path; `req.known`, `req.some`/`n`; `inherit` mods apply in the Society stage via `societyMods`). `G.loreVisible`, `G.loreAvailable`, `G.loreKnown`, `G.loreName` (the gate's name depends on your Path).
- **Branch drafts:** Ideas goals now offer 3 graft branches (`discoveryOptions`; +1 with Wider Gene Pool, +1 with Many Branches). "Add and learn it" grafts and pays; "Add to the tree" grafts only (`G.holdDiscovery`). Learning later: `G.learnLore` from the Lore tab. Old saves' held discoveries become grafts.
- **Costs** (`G.DISCOVERY_BASE`): plain 5, habitat/talent 6, path 8, combined 12, way/legacy/deed 8, gate 12, beyond 22, with the 16.3 percentage (plus Lorekeepers −10% per level) and Voices of the Ancestors (Beyond −15% per level).
- **The Founding** (`founding_gate`) needs the stage's Ideas goal (`evolveAt`, 120) and `G.FOUNDING_NEED` (6, minus Founding Stones) Lore ideas known; learning it brings the founding finale (`nextStep`). Beyond ideas can't be learned after it.
- **Deeds** (`G.DEEDS`, Tribe stage only): tamed (effect or activity), totem, a war won against a band, a band at 50+ opinion, a band raid, moving biome, a finished ceremony, below 20% of comfortable size.
- **Rules and leanings** work in the Lore tree too: `G.mindRule` also reads known discoveries in the Tribe and Society stages, and `G.leaning` counts their `lean` (old discoveries get one from their strongest mod).
- **The Memory of Kinds:** `G.remember(s, what)` counts hunted, fought, attacked, warred, befriended, tamed, revered on `s.history`; `G.grudge(s)` (−40..+30) is halved into the starting opinion of a band descended from it (which also inherits the history). Species cards show "They remember".
- **Ancestral Wisdom** doubles to 24 (tiers 3–4): Lorekeepers, Strong Arms, Many Branches, Founding Stones, Old Friends, Palisades, Voices of the Ancestors, Sharp Minds, Long Lives, Remembered Deeds, Open Hands, Undying Fires. Wisdom `mods` apply through `tribeMods`.
- **A harder Tribe, earned with Ancestral Wisdom:** `G.TRIBE_HARSH` 7 (was 5), Tribe raids strike more often (`G.TRIBE_HIT_CAP` 0.7) and harder (`G.TRIBE_BLOW` 2; the Society stage keeps 0.6 and 1), and the Founding needs 8 Lore ideas (Founding Stones: −2 per level). Test bots with a fully upgraded Creature stage but no Wisdom found their people 13–94% of the time (Singers 13%, Many Minds 94%); with one level of every Wisdom upgrade, 92–100%. In the progressive campaign, a brand-new lineage founds its people about 1 time in 8.
- **Swarm Brood** hatches only from 14 (was 8), and not while the Founding is open, so a Hive can save for it.
- A branch draft with nothing left to offer passes with +3 Food.
- **The Book's Lore page** is `run.book.lore` (`seen`, `known`, `leaning`, rulers) frozen in `becomeSociety`, drawn with `loreTree(run, page)`.

## Update 17: The Book of the Lineage

- **Mind tree bands** (rows, in order): root, home (trunk + home), **body**, **memory**, path tier 3, path tier 4, cap (the Awakening), **beyond**. `bandOf` in ui.js. Lines wrap at 4 nodes; the tree's height follows its content.
- **Body branches** (`group: 'body'`, `when: { talent | keyword | diet | trait | sym }`, `G.bodyBranch`), 35 ideas, visible while your body has the feature (known ones stay).
- **Memories** (`group: 'memory'`, `when: { memory }`), 15 ideas. `G.addMemory(run, id)` records one (Creature stage only) from: hazard events (`G.HAZARD_MEMORY`), a won brawl, a hunt, a successful flight or social option with a species, and each turn: below 15% of comfortable size, living outside the home biome, any extinction, any allied or hostile species. Memories made before the Spark of Mind count.
- **Forks and partial prerequisites:** `excludes` (either side blocks), `req.some` + `req.n` ("2 of these 4"). Tier 2 (home, body, memory) needs a root; tier 3 needs any tier 2.
- **Beyond the Gate** (`group: 'beyond'`, tier 6, cost 34, 2 per Path): need 2–3 of the deepest ideas; learned before the Awakening (which ends the stage at once). `inherit` mods apply in every stage after the Creature stage, labelled "Inheritance". `G.innovationCost` applies Old Paths (−15% per level).
- **Awakenings** (`rule`, `G.MIND_RULES`, `G.mindRule`): outwit / charm_wit / swift_strike (`G.checkStat` lets one stat stand in for another in checks), reroll (once per stage, in `chooseOption`), hazard_sense (hazard events ×0.6), know_foe (−2 on checks against a species), no_rot (half meat rot), last_refuge (below 25% of comfortable size, `damage` halved), calm_presence (+1 opinion a turn to species below 0), insight_spark (+2 Insight per passed check).
- **Leanings:** `lean` on ideas (`G.OLD_LEANS` for the old ones), `G.leaning(run)` counts them; shown as a bar in the Mind header. The Disposition (Update 19) will be built from these.
- **The Book** (`bookTab`): pages Origin, Mind, Lore, Law, Reason, Crown, Legacy; unreached and future ones are greyed. `run.book.origin` is written in `evolve` (cell parts, diet, epochs, body snapshot), `run.book.mind` (`G.freezeMind`: seen and known ideas, leaning, memories) in `becomeTribe`, `run.book.lore` (discoveries, rulers, legacies) in `becomeSociety`. Saves from before Update 17 show only the ideas they knew.
- **Evolution Tree:** Deep Thought (+1 Insight per turn per level, 2 levels) and Old Paths (Beyond ideas −15% per level, 2 levels).

## Patch 16.4: Fair Fights

- `G.wildEdge(run)` = round(`G.difficulty(run, 0)` + 6 − average foe stat (3.5 for cells, 5 after)). `G.foeStat(run, s, stat)` = `G.speciesStat` + edge: the species' evolved stat, shown on species cards.
- `G.checkFoe(run)` is the event's species (not in finales). With a foe, `G.chance` uses difficulty = `foeStat` + (option diff − 6) instead of `G.difficulty`, so an even check is 50% when your stat equals theirs. Average difficulty matches the old one; weak foes are easier and strong foes harder (sampled: late Creature 41% vs 31%, Tribe 40% vs 26%).
- `optionState` returns `foe: { name, them, you }` and the option shows "your X vs their Y".
- Automatic hunts, raids and wars still compare raw stats (their balance is unchanged).

## Patch 16.3.1: Tap to Explain

- **Labelled modifiers:** every entry in `modSources` (and `tribeMods` / `societyMods`) carries a `src` label; `G.modBreakdown(run, key)` sums a modifier by source. `G.mod` is unchanged.
- **Explain panels** (`explainPanel` in ui.js): top-bar items carry `data-act="explain"`; `G.ui.explain` opens a panel under the top bar (food gathered and eaten, comfortable size, resource flow, leader, Ideas/DNA/Influence per turn, season, biome, diet, archetype rule, activity, insight, settlements, council). Time is paused while one is open.
- **Max Population** is kept unrounded until the end of `G.maxPop` (size, Many Minds and Herd multipliers no longer round small bonuses away), and `describeMods` shows `maxPop` as individuals for the current creature.

## Patch 16.3: Tribe rework

- **Resource economy** (game.js): `G.SPECIAL_SOFT` 20 and `G.SPECIAL_HARD` 30. All gains go through `addSpecial` (past the soft cap they are halved; never past the hard cap); a tenth of the excess over the soft cap spoils each turn, and `G.specialUpkeep` takes 1 per 20 heads. Base gain is 2 + `specialPerTurn` a turn. Events `t_too_much`, `t_thieves`, `t_rains` and `t_song_frays` threaten it.
- **Discovery costs:** `G.DISCOVERY_BASE` by `G.discoveryTier` (plain 5, habitat 6, talent 6, path 8, combined 12) × (1 + pct/100), rounded, at least 1. The % (`G.discoveryCostParts`, clamped −60..+100) adds Cunning ((10 − Cunning) × 2, −30..+20), population (−5 per 100 members over 100, to −20), the `discoveryCost` mod (leader traits, backgrounds, the Sage legacy) and timed `run.costMods` from the `costMod` effect. Only the Tribe stage pays. Unaffordable options are disabled; `G.holdDiscovery` keeps up to 3 in `run.held` to learn later from the Discoveries tab (`G.learnHeld`).
- **Leaders:** `G.LEADER_BACKGROUNDS` (lasting mods while they lead) and `G.AMBITIONS` (`want` checked against the reign's start in `l.start`; when met, `run.legacies` gains the ambition's `legacy` mods for good). `startReign` / `endReign` keep `run.rulers` (last 20). `G.leaderPitch` writes the `{cand0h}` hint shown under each succession option.
- **Tribe world screen** (render.js): `campSpot` scores a grid by distance from hunters, bands and hostile species and closeness to tamed and friendly ones, with a penalty for moving away from the current camp; `updateCamp` walks the camp there (and to the map edge while migrating, and in from the edge in a new biome). `drawTribeCamp` grows with `campLevel` (discoveries, years, gear or home: huts, pen, totem, palisade at 5+), and shows bundles while moving. `drawExpedition` sends 2–8 of your people (members, Charm, meat-eaters) to the activity's target or the map edge. `worldReach` (discoveries and years) shrinks everything by up to 28% and fades in the neighbouring biomes at the edges. Other species' labels are names only when more than 8 herds share the map.

## Patch 16.2: Cut Paper (art)

- **How other games avoid an asset per combination:** parts are drawn procedurally and *composed* by rules rather than drawn as finished pairs. Primordia keeps one drawing per part and composes merges like stacked cut-outs: the base half of a slot draws normally; the merged (recessive) half (`look().REC`) is redrawn by the same slot block on its own, moved by a per-slot rule (`makeCards` and `cards(slot, place, block)` in render.js), before the base, so it sits behind as a second card: tails fork (rotated up, 80%), back parts sit further down the spine (75–78%), skins split front and back at a stitched seam, sea arms and underside parts sit further back (80%), and a merged foot or hand is a 72% card behind the main one. Evolution extras are only drawn for the base card.
- **Limb details** use the limb's own path (`along(u)`, `onLimb(u, fn)` in `leg()`), so plates, muscle, joints, tendons and feathers follow the leg.
- **Smooth (Patch 16.2.2).** The stop-motion stepping of 16.2.1 made players motion sick and is gone: everything animates smoothly every frame. Poses are cut out and cached `G.POSE_FPS` (30) times a second, at up to 460 px, with the cache's canvases reused; placement and movement are smooth. Kept from 16.2.1: `paperT` (leans and hops instead of squash and stretch) and props drawn in the build-up. Background creatures in scenes keep one cached pose as they glide past.
- **Cut paper** (`G.CUTOUT`): `drawBody` renders the raw body (`drawBodyRaw`) into an offscreen canvas with a hard per-fill shadow (every piece shadows the piece under it), adds paper grain (source-atop), then composites a drop shadow and a pale cut edge from the silhouette and places the result. Body gradients become flat colours with a separate belly piece; faces get the same shadow. Finished cut-outs are cached per body, size, resolution bucket and pose time, so a creature is only re-cut when its pose changes. The ground shadow stays in the world, under the cut-out.

## Patch 16.1 (play-testing feedback)

- **Soft and hard population caps.** `G.maxPop` is now the comfortable size (soft cap); `G.hardPop` is 1.5× it (`G.HARD_CAP`). Gains past the soft cap land at half strength (`G.capGain`); broods cost `1 + 2 × crowding` times as much (`G.crowding` = share over the soft cap); members past it eat twice (`G.upkeep`); crowding sickness takes a tenth of the excess each turn. Clamps use the hard cap.
- **Diets can change.** Omnivore mouths are always offered (herbivores and carnivores never see the opposite diet's mouths directly), so a lineage can move herbivore → omnivore → carnivore and back; only Grazers (no carnivore parts) and Predators (no herbivore parts) are locked for good.
- **Limbs match the body plan.** Evolved front or hind limbs no longer draw an extra pair (land) or an extra fin (sea); they are longer and thicker instead.
- **Only what you can use right now** (`G.useless`, recomputed from your current diet, so things come back when it changes; omnivores see everything): anything whose `diet`/`req.diet` excludes yours, any hunting bonus for herbivores and Grazers, and any foraging bonus for Predators is hidden: Mind innovations (`innovationVisible`), discoveries, the Hunt Instinct and Activity for herbivores, and event options whose diet or archetype lock you can never meet (`optionState(...).hidden`).
- **Diet badge** (`dietBadge` in ui.js): green Herbivore, red Carnivore, gold Omnivore, in the top bar and the lineage sheet.
- **Disaster scenes.** `G.HAZARD_OF` maps events to eight hazards (flood, storm, cold, sickness, drought, fire, dust, quake); an event can also set `hazard`. With no species involved, the scene builds up for 1.8 s while the hazard closes in and engulfs the screen (`hazardLayer`), then clears to show the outcome; bad outcomes leave marks (`hazardMarks`) and no comic words, dizzy stars or red flash. The face shows worry, fear or sadness instead of dizziness.
- **Biomes.** Each biome has a `danger` (attack multiplier: jungle 1.35, plains 1.15, desert 0.7, kelp 0.7...), `hazards` (its disasters weigh ×3 in events; other disasters ×0.35), a `rule` shown on the World Map tab, stronger `mods`, and `cold` (cold blood: −2 Speed, −1 Food). `BIOME_LOOK` and `biomeAtmosphere` (render.js) give each biome its own sky, hills, ground and weather in event scenes and on the map.
- **Strong builds.** `G.TRIBE_THREAT` 3 (was 2) and rival bands match your Strength minus 3 (was 1): a powerful people pulls further ahead.

## Instinct (CK3-style focus)

Forage, Hunt, Breed, Explore or Lie low. Your Instinct sets your Food income and makes matching events more likely. You can change it at any time.

## Archetypes (each breaks one rule for the whole run)

Difficulty (shown on the setup screen): **Gentle**: Drifter. **Tricky**: Predator, Symbiote, Mimic. **Hard**: Grazer, Parasite, Colony.

**Hidden power** (`G.power`, never shown): 75% from the share of the Evolution Tree bought and 25% from wins (up to 8), fixed in `run.power` when a run starts. It adds up to +4 harshness to every non-finale check (`G.harsh`) and makes predators up to 40% more likely to strike.

| Archetype | Gimmick |
|---|---|
| Drifter | The current picks your Instinct (forage or hunt, by diet). Every 8 turns it carries you on: your worst enemy is replaced by a new species, and half the time you can absorb one of its parts. |
| Grazer | Max Population ×1.6; DNA per turn = Population ÷ 6; no hunting or meat-eating mouths; damage ×1.5. |
| Predator | No foraging; hunting only feeds you on a kill (a roll on your best of Strength and Speed). Food storage halved. 5 turns without a kill and you starve. Kills can let you devour a part. |
| Symbiote | Joined to a partner species (allied, never attacks). +⅙ of its stats; swap parts with it (3 DNA); −2 Food while it struggles; lose half your kind if it dies out (then a new partner). |
| Parasite | Lives inside a host: +2 Food (3 as a creature) from feeding; max Population ≤ 60% of the host's; drains and angers the host. Steal a part (3 DNA) or jump hosts (3 DNA, lose a quarter of your kind). If the host dies, half of you die too. |
| Colony | Always grows without symmetry. When full and well fed, a third splits off as an allied offshoot species (up to 3). Reshaping costs half. |
| Mimic | Disguise as any species (3 DNA): take its colors and copy a part. Checks involving it are 2 easier, and as a predator it attacks 40% less. |

Each archetype has a status chip in the top bar (Hunger, Host, Partner, Current, Herd DNA, Offshoots, Disguise) and its own events. Test bots, fresh: 25–45% reach the creature stage and 3–12% win, depending on archetype. Fully upgraded: 77–100% win.

## Builds

- **Slots.** Cell has Mouth, Motion and Membrane, plus Senses and Organ once multicellular. Land creatures have Mouth, Senses, Front limbs, Hands, Hind limbs, Feet, Back, Skin and Tail. Sea creatures have Mouth, Senses, Front fins, Arms (pincers, tentacles, clubs: the sea's hands), Rear fins, Underside (walking legs, suckers, belly lights), Dorsal, Skin and Tail.
- **Merging.** From the very first draft, a new part can merge with the one in its slot, keeping both sets of stats and keywords ("Venomous Fangs"). A slot holds at most two parts. A new part on a merged slot (from a draft or a random mutation) swaps out only one half, so a merged part stays merged.
- **Evolutions.** 125 recipes (Ball x Pit style): merging the right two parts in a slot evolves them into one stronger part, which can merge again. Some tier 1 evolutions evolve again into tier 2 legendaries. Drafts name known recipes and hint at unknown ones. Discoveries are saved in the Codex (+5 Genetic Memory each) and gate unlocks: Venom Glands (1), Symbiote (2), Toxic Bloom (4), Parasite (5).
- **Carry-over.** When you leave the Cell stage, only your mouth and your evolved parts grow into creature parts. Everything else is left behind; the archetype fills essential empty slots.
- **Basic limbs.** Every creature starts with Stubby Forelegs and Hind Legs (or Stubby Fins at sea). Limb mutations (Long Bones, Thick Muscle, Gripping Pads, Bony Plates, Skin Flaps, Soft Bones, Springy Tendons, Balance Organ, Long Fin Rays) merge with them to grow every advanced limb: runner legs, haunches, pillars, hoppers, upright legs, arms, wings, tentacles, fins and flippers.
- **Flight.** Stubby Forelegs + Skin Flaps → Wing Membranes; + Flight Feathers → Feathered Wings (or Slender Forelegs + Wing Membranes → True Wings). Flyers soar above the map and unlock flight choices in events.
- **Roguelike unlocks.** Evolved parts (including advanced limbs) never appear in drafts until you have created them by merging. Once discovered, they can turn up in drafts in every later run (legendaries rarely). The end screen lists what a run unlocked.
- **Visual variety.** Merged and evolved parts draw every ingredient layered together. Evolved slots reshape the body: bigger heads with extra teeth, extra eyes, longer and thicker limbs (a third pair for tier 2), bigger claws, a crest of spikes, glowing skin, forked tails.
- **Symmetry.** Becoming multicellular means choosing a symmetry for good. **Bilateral** (head and tail, legs in pairs, +2 Speed). **Radial** (starfish on land, jellyfish at sea): +Cunning and Toughness but slow and weak, with no hind limbs, feet or tail. **No symmetry** (an oozing colony on pseudopods): big colonies and Food, but dim, clumsy and charmless, with no hands, feet or tail.
- **Body plan.** In the Creature stage the Body plan tab changes your number of limb pairs, arms or pseudopods for 4 DNA a step. On land you also choose how many of those pairs are arms (`G.armPairs`): one leg pair stands upright with hands free (+Insight), more leg pairs make a centaur, and no legs makes an arm-crawler (−2 Speed). Arms add +1 Cunning; each extra arm pair adds Strength and upkeep. Bilateral: 0 pairs is a **Serpent** (snake or eel; stealthy hunter, but loses every limb slot), 1 pair stands on two legs (+Insight), 2 is the classic four legs, 3 is six legs, and up to 8 pairs makes a **Centipede** (very fast and tough, but always hungry and unloved). Radial: 3 to 8 arms; Colonial: 2 to 8 pseudopods. More segments mean more Food eaten each turn. Slots a body plan doesn't use are greyed out; parts there are kept but do nothing, and drafts skip them. Some events need a body plan (serpents slither into burrows, radial creatures regrow lost arms, colonies bud).
- **The Creature Editor.** A full-screen editor with a live animated preview opens when you become a creature, and is always free from the Look tab. Bodies tilt to match their front and hind limb lengths, and are framed to fit any box. Tabs:
  - **Body:** shape, length, height, back slope, neck length (long necks need the Age of Giants), posture.
  - **Limbs/Fins:** length, thickness, spacing, position; fin styles at sea.
  - **Head:** shape, position (neck, forward, high, tucked), size, 1–6 eyes, eye size, jaw size, eye style.
  - **Colors:** body, belly and two pattern colors; 12 patterns (plain, spots, stripes, armor bands, glow spots, rings, patches, countershading, two-tone, rosettes, tiger, iridescent) with size and density; matte, glossy or glowing finish.

  Some options unlock with progress (`need` in `G.APPEARANCE`, `cap` in `G.SCULPT`). Looks never change stats. Rival species get random looks from the same system.
- **Foundations.** Three one-time choices in the Creature stage, shown in the Body plan tab and on every species sheet:
  - **Frame** (at the start of the stage): **Inner Skeleton** (the only frame that can grow giant on land); **Outer Shell** (+2 Toughness, half-price body plan changes, −2 Speed, and every 12 turns you molt: 2 turns of taking extra damage); **Soft Body** (+2 Cunning, hunters strike 20% less often, but −2 Toughness).
  - **Young** (8 turns in): **Live Young** (+1 Toughness and Charisma, but only 1 birth a turn); **Eggs** (+1 max Population and twice the births, but eggs get stolen); **Budding** (radial and colonial bodies only: steady births, less Charisma).
  - **Blood** (13 turns in): **Warm** (+1 Speed and no hungry seasons, but more Food eaten); **Cold** (less Food eaten, but −2 Speed and −1 Food in winter, cold seas, tundra and polar waters; +1 Speed in summer, blooms, desert and vents).

  Each choice unlocks its own events (molting, clutches, egg thieves, basking stones, cold snaps, drying out, squeezing through cracks). Rival species get random foundations too, and many grow into a matching shape: armored bugs with jointed legs and compound eyes, snails and woodlice, slugs, birds with beaks and feathers, lizards with sticky tongues, crabs and sea slugs.
- **Size.** Every creature has a real size (centimeters to meters) shown on its map label, its sheet and the Body tab. Small creatures live in herds 1.5× bigger and eat less each, but every blow kills more of them. Giants live in small herds, eat a lot and shrug off damage. Max Population also grows with each milestone. Event gains and losses scale with herd size.
- **Keywords:** Venom, Armor, Swift, Glow and Symbiont. Two parts give a stat bonus; three give a stronger bonus.
- **Tags:** grasping parts (hands, arms, tentacles, trunk, prehensile tail) unlock tool events and the Tools innovation. Upright legs free the hands and boost Insight.
- **Traits** come from events and milestones and last the whole run. Your diet when leaving the Cell stage gives a heritage trait.

## The world

**The sea has depth.** Sea creatures choose a home depth in the Instinct tab (3 DNA to move): Sunlit Shallows (lots of food, nowhere to hide), The Reef (friends and shelter, slow), Open Water (fast hunters), the Twilight Zone (sharp senses; needs a Glow part, sharp senses or Pressure Skin) and The Abyss (safe but hungry; needs a Glow part or Pressure Skin). The sea map is a side-on slice of ocean with every herd at its home depth, and some events only happen at certain depths.


The map gives every herd a home territory spread across it, with scenery (trees, bushes, rocks and a pond on land; kelp, coral and rocks at sea). Flyers soar above the ground with shadows beneath. Every stage has named species with roles (predator, prey, rival, neighbor), an opinion of you and a population. Other species have their own symmetry and body plan too (starfish, jellyfish, snakes, centipedes, colonies). Their herds roam the world map: crowd size shows population, sprite size scales with real body size, and each label reads name · population · size. Predators chase prey, hostile species drift toward you, allies stay close. Populations rise and fall each tick; species can go extinct and newcomers arrive. Tap a herd (or a species in the World tab) to see its sheet, and tap its portrait to view it full screen. Hunting or beating a species thins its numbers.

## The World Map

- **Biomes** (`G.BIOMES`):
  - **Cell:** Thermal Vent (home), Sunlit Surface, Mud Flats.
  - **Land:** Open Plains (home), Jungle, Desert, Tundra, Swamp, Shore.
  - **Sea:** Warm Seas (home), Kelp Forest, Polar Sea, Vent Fields, Coast. Your home depth still applies within each sea region.

  Each biome has stat effects, its own scenery and ground colour, events (`biome:` in events.js) and parts (`biome:` in parts.js, drafted only there, 3× as often). Biomes only matter once you are multicellular.
- **Vision and travel** (`G.vision`):

  | Vision | When | What you see | How you move |
  |---|---|---|---|
  | 0 | Cell stage | Your own biome | Only by events (rising bubbles, falling silt, the warm current) |
  | 0 | Early creature | Your own biome | Migrate to a random neighbour |
  | 1 | Cunning 6 or the Spark of Mind | Neighbours too | Choose your destination on the Map tab |
  | 2 | Keen Memory, Lone Wanderers or Symbolic Thought | The whole world | Choose your destination |

  Arriving somewhere new replaces most of your neighbours. Partners, hosts, offshoots and nemeses follow you.
- **Crossing over.** The Shore (land) and the Coast (sea) allow the Cross over activity: 5 turns and a quarter of your kind. Parts that only work in the old habitat are lost, basic limbs and a mouth are filled in, the world is new, and the editor opens.

## The Living World

- **Niches.** Every species fills a niche (`G.NICHES`: apex predator, small hunter, big grazer, small grazer, scavenger, forager, browser, gentle giant). The cell stage starts with 6 species and the creature stage with 9. Species in the same niche share its room to grow.
- **Extinction and successors.** When a species dies out, its niche opens. 3–6 turns later, a survivor's descendant evolves into it (inheriting its body, with a mutation) or newcomers arrive. Species also keep mutating. Migrating herds pass through for 5 turns.
- **Ages.** Every 4 turns the dominant species (population × size, predators count extra), or your kind, names the age. A new power must stay on top for two checks in a row. The World tab shows the history.
- **Seasons** (creature stage, 6 turns each; `G.SEASONS`) change food and stats and have their own events.
- **Activities** (`G.ACTIVITIES`), one at a time:

  | Activity | Effect |
  |---|---|
  | Migrate | 4 turns at −1 Food; arrive among 3 new neighbours with +3 Food and +3 DNA. 10-turn rest. |
  | War | War score moves each turn with strength and numbers; ±100 ends it. Victory crushes them; defeat costs Population. Either way they become your nemesis. 8-turn rest. |
  | Court | A Charm roll each turn; allies at opinion 60. |
  | Avoid | −2 Food a turn; they attack 70% less. |
  | Hunt them | A hunt roll each turn: food, but big or fast prey fights back. |
  | Scout | 3 turns at −1 Food, then a feeding ground, a part to borrow, or DNA. 12-turn rest. |

  Activity events (`activity:` in events.js) only happen while that Activity is under way.
- **Nemesis and sworn allies.** Opinion −90 (or a war) makes a nemesis, which raids you and hunts you more often. Opinion +90 makes a sworn ally, which brings gifts.
- **Story chains.** An event result with `chain` schedules a follow-up event (`chained: true`) a few turns later, for example the Strange Egg and the Plea for Help.
- **Predators share the hunt.** Each predator's chance to strike shrinks with the number of predators, so a crowded world isn't automatically deadlier.

## Scenes

After every choice, a scene acts out what happened. When another species is involved, both sides play a story: you chase and eat prey, win or lose a brawl, get mauled, escape while the predator looks confused, befriend them, or get snubbed. Babies pop into your herd when it grows; ghosts float up when it shrinks; food flies in or away. Props come from the event (ice, fire, fruit, tar, whirlpools, viruses and more), with cartoon faces and comic words.

## Between runs

- **Genetic Memory per run:** DNA collected ÷ 3 (plus, for a lineage that dies as a cell, 1 per 4 turns survived and at least 6 in total), +5/+10/+5/+10 for each stage milestone, +40 for winning; ×1.25 per hostility level, ×0.6 for a revived fossil.
- **Gene Affinities** (open after the first win): 8 families (Wings, Venom, Armor, Speed, Glow, Hands, Senses, Limbs), 3 levels each (30/60/100), each level adds +1× to that family's draft weight.
- **First-time tips:** `G.TUTORIALS` in world.js. Each has a `when(run, ui)` condition and shows once, the first time it holds, in any run; seen ids are saved in `meta.tips`. Tips pause time and never show while the Creature Editor is open.

**It's a roguelike.** Every check is harder by `G.HARSH` (6; finales are exempt). Predators and hostile species attack every turn: the chance (`G.PREDATION` 0.34 plus 0.04 per point of gap) and the size of each strike grow with the gap between their Strength and your Toughness plus half your Speed. A fresh lineage usually dies in the cell stage. Upgrades in the Evolution Tree pay the harshness back, so each run gets further. Test bots: a fresh bot reaches the creature stage about 25% of the time and rarely wins; a fully upgraded bot wins about 88%. In whole campaigns, bots win about 4% of first runs and 40–60% by runs 12–15.

- **Evolution Tree** (22 nodes in 6 columns, about 1,300 Genetic Memory to complete): Hardy Ancestors, Ancestral Pantry, Deep Memory, Rich Genes (+10% DNA), Second Look (reroll), Amber; +1 stat nodes; Second Chance (survive extinction once per run); Short Road (DNA goals −8% per level); Wider Gene Pool; Ancestral Armor; Head Start (a free draft); and the **Twin sockets**.
- **Twin sockets.** Normally every slot holds one part (merged or not). A Twin upgrade (Mouth, Organ, Senses, Back, Hands, Skin) lets that one slot hold a second part ("hands2"), which merges and evolves on its own.
- **Fossil Record.** Every milestone and new stage saves a fossil (a snapshot of the run). Keep up to 1–3 in amber; reviving one costs 12–45 Genetic Memory and the run earns 60%. A gallery lists the last 30 lineages.
- **Finales** get 1 easier per failed attempt.

- **Genetic Memory** = DNA ÷ 3 + milestone bonuses + 40 for winning, × Hostility bonus.
- **Unlocks:** archetypes, home worlds, mutation packs, ancestral boons and Hostility 1–5.
- **Codex of Life:** every event, part and ending found.
- **Endings:** Firekeepers, Unifiers, Conquerors and Wanderers (land); Deep Singers, Reef Builders, Tide Lords, Shell Smiths (tools) and Vent Keepers (the sea's fire) (sea).
- **Shared words:** events use {herd}, {nests}, {cover}, {home}, {move} and {depth}, which change with your body, so one event reads right on land and at sea.

## Next steps

See [ROADMAP.md](ROADMAP.md) for the themed updates planned from here.
