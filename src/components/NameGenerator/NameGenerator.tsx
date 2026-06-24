import { useState, useCallback, useMemo } from 'react';
import type { Player } from '../../types';
import './NameGenerator.css';

interface Props {
  players: Player[];
}

type Vibe = 'funny' | 'serious';

const PLAYER_PUNS: [string, (name: string) => string][] = [
  ['Mahomes', (n) => `No Place Like ${n}`],
  ['Mahomes', (n) => `${n} Alone`],
  ['Mahomes', (n) => `${n} Depot`],
  ['Allen', (n) => `${n} Iverson's Crossover`],
  ['Allen', (n) => `${n} Wrench`],
  ['Hurts', (n) => `${n} So Good`],
  ['Hurts', (n) => `Love ${n}`],
  ['Hurts', (n) => `${n} Don't It`],
  ['Lamar', (n) => `Kendrick ${n}`],
  ['Jackson', (n) => `${n} 5ive`],
  ['Robinson', (_n) => `Bijan' Your Time`],
  ['Robinson', (_n) => `Mrs. Doubtfire's Bijan`],
  ['Henry', (n) => `King ${n} VIII`],
  ['Henry', (n) => `The ${n} Stiff Arm Society`],
  ['Chase', (n) => `The ${n} Is On`],
  ['Chase', (n) => `Cut to the ${n}`],
  ['Chase', (n) => `Wild Goose ${n}`],
  ['Jefferson', (n) => `George ${n}'s Movin' On Up`],
  ['Jefferson', (n) => `The ${n} Airplane`],
  ['Hill', (n) => `Over the ${n}`],
  ['Hill', (n) => `${n} Yeah`],
  ['Hill', (n) => `King of the ${n}`],
  ['Lamb', (n) => `Silence of the ${n}s`],
  ['Lamb', (n) => `${n} of God`],
  ['Lamb', (n) => `Mary Had a Little ${n}`],
  ['Kelce', (n) => `${n} Grammar`],
  ['Kelce', (_n) => `Kelce's Heroes`],
  ['Gibbs', (n) => `${n}' Slap`],
  ['Gibbs', (n) => `Barry ${n}s`],
  ['Barkley', (n) => `Charles in Charge of ${n}`],
  ['Barkley', (n) => `Gnarls ${n}`],
  ['Brown', (n) => `Charlie ${n}'s All Stars`],
  ['Brown', (n) => `The ${n} Bomber`],
  ['Cook', (n) => `Too Many ${n}s`],
  ['Cook', (n) => `What's ${n}in' Good Lookin'`],
  ['Moore', (n) => `I Want ${n}`],
  ['Moore', (n) => `Less Is ${n}`],
  ['Moore', (n) => `${n} Problems`],
  ['Taylor', (n) => `Swift Kick in the ${n}`],
  ['Taylor', (n) => `${n} Made`],
  ['Wilson', (n) => `Cast Away ${n}`],
  ['Wilson', (n) => `${n}!!! (Volleyball voice)`],
  ['Smith', (n) => `The Fresh Prince of ${n}`],
  ['Jones', (n) => `Keeping Up with the ${n}es`],
  ['Jones', (n) => `Indiana ${n}`],
  ['Williams', (n) => `${n}burg Bridge`],
  ['Williams', (n) => `Pharrell ${n}`],
  ['Adams', (n) => `John ${n}s`],
  ['Adams', (n) => `The ${n}s Family`],
  ['Diggs', (n) => `Can You ${n} It?`],
  ['Diggs', (n) => `Gold ${n}ger`],
  ['Mixon', (n) => `${n} It Up`],
  ['Mixon', (n) => `DJ ${n}`],
  ['Waddle', (n) => `${n} I Do`],
  ['Waddle', (n) => `The Penguin ${n}`],
  ['Pitts', (n) => `Brad ${n}`],
  ['Pitts', (n) => `The ${n} of Despair`],
  ['Nabers', (n) => `Won't You Be My ${n}`],
  ['Nabers', (n) => `Good ${n}`],
  ['Tucker', (n) => `${n} Carlson Kicking Machine`],
  ['Butker', (n) => `The ${n} Did It`],
  ['Stroud', (n) => `Shroud of ${n}`],
  ['Purdy', (n) => `Sitting ${n}`],
  ['Purdy', (n) => `${n} Good Year`],
  ['Kyren', (n) => `${n} the Wrath of God`],
  ['Swift', (n) => `Too ${n} for You`],
  ['Akers', (_n) => `Acre by Acre`],
  ['Flowers', (n) => `Pushing ${n}`],
  ['Hall', (n) => `Deck the ${n}s`],
  ['Hall', (n) => `${n} of Fame`],
  ['Daniels', (n) => `Jack ${n}`],
  ['Daniels', (n) => `Stormy ${n}`],
  ['Love', (n) => `What is ${n}?`],
  ['Love', (n) => `All You Need Is ${n}`],
  ['Rice', (n) => `${n} ${n} Baby`],
  ['White', (n) => `Snow ${n}`],
  ['Chubb', (n) => `${n}by Checker`],
  ['Chubb', (n) => `The ${n}by Bunny`],
  ['Murray', (n) => `Bill ${n}`],
  ['Burrow', (n) => `The ${n}ing Machine`],
  ['Burrow', (n) => `Down the Rabbit ${n}`],
  ['Achane', (n) => `Ball and ${n}`],
  ['McLaurin', (n) => `My ${n}s`],
  ['St. Brown', (_n) => `Amon-Ra Vision`],
  ['Olave', (_n) => `Olave Garden`],
  ['McVay', (_n) => `McVay All Day`],
];

const FUNNY_TEMPLATES = [
  'Touchdowns & Therapy',
  'My Couch Pulls Out But I Don\'t',
  'Forgetting Brandon Marshall',
  'Average Joes',
  'Ctrl + Punt + Delete',
  'Rumble in My Jumble',
  'Show Me Your TDs',
  'Between a Jock and a Hard Place',
  'The Replacements',
  'Multiple Scoregasms',
  'Victorious Secret',
  'The League of Ordinary Gentlemen',
  'Desparate Housewives of the NFC',
  'The Fantasy Footballers Who Don\'t Football',
  'Autodraft All-Stars',
  'Benched Feelings',
  '0-13 And Loving It',
  'Last Place Trophy Room',
  'Commissioner\'s Worst Nightmare',
  'Waiver Wire Warriors',
  'Sir Lancelot of the Bench',
  'Game of Throw-Ins',
  'The Fumble Bees',
  'Gridiron Goobers',
  'Snack Break at Halftime',
  'Couch Potato Champions',
  'Draft Day Dumpster Fire',
  'The Bye Week Blues Band',
  'Panic Trades & Pizza',
  'Roster Roulette',
  'Sunday Scaries FC',
  'The Sack Lunch Bunch',
  'Interception Inception',
  'Two and a Half Points',
  'License to Ill-advised Trades',
  'I Barely Know \'Er (Route)',
];

const SERIOUS_TEMPLATES = [
  'Iron Curtain',
  'Gridiron Vanguard',
  'The War Room',
  'Steel Legion',
  'Crimson Tide',
  'Apex Predators',
  'Phantom Brigade',
  'The Dynasty',
  'Thunder Dome',
  'Blackout Squad',
  'The Gauntlet',
  'Warhawks',
  'The Armory',
  'Dark Horse Rising',
  'Scorched Earth',
  'End Zone Empire',
  'Vengeance FC',
  'Cold Blooded',
  'Red Zone Reapers',
  'Shadow Wolves',
  'The Kingmakers',
  'Iron Throne',
  'Night Raid',
  'Siege Engine',
  'The Executioners',
  'Frontline Fury',
  'Lone Wolf Pack',
  'The Colosseum',
  'Valhalla Bound',
  'Warpath',
  'The Firm',
  'Blitz Brigade',
  'Endgame Protocol',
  'No Mercy League',
  'Total Domination',
  'Relentless',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function NameGenerator({ players }: Props) {
  const [vibe, setVibe] = useState<Vibe>('funny');
  const [names, setNames] = useState<string[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);

  const lastNames = useMemo(
    () => players.map((p) => p.name.split(' ').slice(-1)[0]),
    [players]
  );

  const matchedPuns = useMemo(() => {
    const set = new Set(lastNames);
    return PLAYER_PUNS.filter(([name]) => set.has(name));
  }, [lastNames]);

  const generate = useCallback(() => {
    setSpinning(true);
    setTimeout(() => {
      const batch: string[] = [];
      const used = new Set<string>();

      while (batch.length < 5) {
        let name: string;
        if (vibe === 'funny') {
          if (matchedPuns.length > 0 && Math.random() < 0.6) {
            const [lastName, template] = pick(matchedPuns);
            name = template(lastName);
          } else {
            name = pick(FUNNY_TEMPLATES);
          }
        } else {
          name = pick(SERIOUS_TEMPLATES);
        }
        if (!used.has(name)) {
          used.add(name);
          batch.push(name);
        }
      }
      setNames(batch);
      setSpinning(false);
    }, 400);
  }, [vibe, matchedPuns]);

  const toggleSave = (name: string) => {
    setSaved((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const copyName = (name: string) => {
    navigator.clipboard.writeText(name);
  };

  return (
    <div className="card namegen">
      <div className="card-head">
        <div>
          <h2>Team Name Generator</h2>
          <p className="card-sub">Find your perfect fantasy team name. Hit generate for fresh ideas.</p>
        </div>
      </div>

      <div className="ng-body">
        <div className="ng-controls">
          <div className="vibe-toggle">
            <button
              className={'vibe-btn' + (vibe === 'funny' ? ' active' : '')}
              onClick={() => { setVibe('funny'); setNames([]); }}
            >
              <span className="vibe-icon">&#x1F602;</span>
              Funny
            </button>
            <button
              className={'vibe-btn' + (vibe === 'serious' ? ' active' : '')}
              onClick={() => { setVibe('serious'); setNames([]); }}
            >
              <span className="vibe-icon">&#x1F525;</span>
              Serious
            </button>
          </div>

          <button className={'ng-generate' + (spinning ? ' spin' : '')} onClick={generate} disabled={spinning}>
            {spinning ? 'Generating…' : 'Generate Names'}
          </button>
        </div>

        {names.length > 0 && (
          <div className="ng-results">
            {names.map((name) => {
              const isSaved = saved.includes(name);
              return (
                <div className="ng-name-row" key={name}>
                  <span className="ng-name">{name}</span>
                  <div className="ng-actions">
                    <button
                      className="ng-action-btn"
                      title="Copy"
                      onClick={() => copyName(name)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                      </svg>
                    </button>
                    <button
                      className={'ng-action-btn' + (isSaved ? ' saved' : '')}
                      title={isSaved ? 'Unsave' : 'Save'}
                      onClick={() => toggleSave(name)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {names.length === 0 && !spinning && (
          <div className="ng-empty">
            <span className="ng-empty-icon">{vibe === 'funny' ? '🏈' : '⚔️'}</span>
            <p>Pick a vibe and hit generate</p>
          </div>
        )}

        {saved.length > 0 && (
          <div className="ng-saved">
            <h4 className="ng-saved-title">Saved ({saved.length})</h4>
            {saved.map((name) => (
              <div className="ng-saved-row" key={name}>
                <span>{name}</span>
                <button className="ng-action-btn" onClick={() => copyName(name)} title="Copy">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                </button>
                <button className="ng-action-btn" onClick={() => toggleSave(name)} title="Remove">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
