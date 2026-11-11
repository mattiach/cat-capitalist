/**
 * Every icon the game can show, by name. Rules and data only refer to names; game/art/icons.ts holds one
 * drawing per name, and the compiler keeps the two in step.
 */
export type IconName =
  // Currencies and interface
  | 'fish' | 'diamond' | 'halo' | 'chart' | 'bolt' | 'lock' | 'check' | 'close' | 'fullscreen' | 'shuffle' | 'arrowLeft' | 'arrowRight' | 'arrowUp'
  | 'star' | 'sparkle' | 'flame' | 'rainbow' | 'heart' | 'sleep' | 'exclaim' | 'play' | 'pause' | 'previous' | 'next'
  | 'note' | 'bell' | 'paw' | 'catFace' | 'catLove' | 'catWow' | 'catHalo' | 'headphones' | 'celebrate'
  // Tabs and awards
  | 'shop' | 'sofa' | 'gamepad' | 'floppy' | 'trophy' | 'coin' | 'coins' | 'banknote' | 'bank' | 'galaxy' | 'planet' | 'comet'
  | 'tie' | 'clipboard' | 'shoppingBag' | 'magnifier' | 'dress' | 'pouch' | 'racecar' | 'flask' | 'house' | 'dove' | 'shield'
  | 'temple' | 'briefcase' | 'cloudBolt' | 'medal' | 'infinity' | 'yarn' | 'box' | 'rocket' | 'allBusinesses'
  // Hats
  | 'pinkBow' | 'baseballCap' | 'flowerCrown' | 'topHat' | 'royalCrown' | 'tinyTopHat' | 'crystalCrown' | 'diamondTiara'
  | 'paperHat' | 'beanie' | 'partyHat' | 'strawHat' | 'chefHat' | 'cowboyHat' | 'witchHat' | 'vikingHelmet' | 'wizardHat'
  | 'astronautHelmet' | 'goldenHalo' | 'phoenixCrown'
  // Glasses, drawn around the cat's eyes
  | 'readingGlasses' | 'coolShades' | 'bubblegumShades' | 'spaceGoggles' | 'falseLashes' | 'roundSpecs' | 'blackEye' | 'tapeSpecs'
  | 'piratePatch' | 'monocle' | 'heartShades' | 'sleepMask' | 'threeDGlasses' | 'starShades' | 'aviators' | 'masqueradeMask'
  | 'cyberVisor' | 'diamondLashes' | 'laserVisor'
  // Accessories
  | 'tinyBell' | 'cozyScarf' | 'goldMedal' | 'diamondCollar' | 'luckyDuck' | 'mouseToy' | 'catSocks' | 'ducklingPond' | 'pizzaPlush'
  | 'roseClip' | 'tunaJuice' | 'musicBox' | 'luckyDice' | 'gameController' | 'partyPopper' | 'diamondRing' | 'rainbowCollar'
  | 'soccerBall' | 'catPhone' | 'gooseParade' | 'gamingLaptop' | 'sushiPlush' | 'goldenGoose' | 'drumSolo' | 'purrfectPC'
  | 'treasureChest' | 'luckyClover' | 'crystalBall' | 'prismPin' | 'starlightScarf' | 'fishBone' | 'bowTie' | 'yarnToy'
  | 'spikedCollar' | 'pearlNecklace' | 'featherWand' | 'pocketWatch' | 'goldenBell' | 'angelWings' | 'cosmicCollar'
  // Specials
  | 'wizardSpecs' | 'houseScarf' | 'webMask' | 'monsterBall' | 'arcReactor' | 'heroCrest' | 'sweetroll' | 'laserSword'
  | 'dragonbornHelmet' | 'darkLordHelmet' | 'chaosPlush' | 'warPaint' | 'mouseEars' | 'bowMouseEars' | 'heroCard'
  | 'tycoonStatue' | 'bobblehead' | 'pixelSword' | 'pixelAxe' | 'blockPig' | 'redGuitar'
  // Hairstyles
  | 'mohawk' | 'afro' | 'quiff';
