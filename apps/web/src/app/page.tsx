// app/page.tsx (or pages/index.tsx)
import './globals.css';
import Image from 'next/image';
import Link from 'next/link';

// Import your images from public or relevant asset pipeline
import arrow from '@/assets/landing/arrow.svg';
import heroImage from '@/assets/landing/hero-image.png';
import underline from '@/assets/landing/underline.png';
import deliveryIcon from '@/assets/landing/icons/delivery.svg';
import locationIcon from '@/assets/landing/icons/location.svg';
import starIcon from '@/assets/landing/icons/star.svg';
import sportverenigingen from '@/assets/landing/sportverenigingen.jpg';
import studentenverenigingen from '@/assets/landing/studentenverenigingen.jpg';
import jaarclubs from '@/assets/landing/jaarclubs.jpg';
import bars from '@/assets/landing/bars.jpg';
import click from '@/assets/landing/icons/click.svg';
import link from '@/assets/landing/icons/link.svg';
import checkbox from '@/assets/landing/icons/checkbox.svg';
import map from '@/assets/landing/map.svg';

const statistics = [
  { label: 'maaltijden bezorgd', value: '33.5k', icon: deliveryIcon },
  { label: 'op tijd bezorgd', value: '94%', icon: locationIcon },
  { label: 'sterren op google', value: '5/5', icon: starIcon },
];

const howSteps = [
  {
    icon: click,
    title: '1. Start een bestelling',
    description: 'Vul binnen 3 minuten je gegevens in en ontvang jouw unieke link.',
  },
  {
    icon: link,
    title: '2. Deel jouw unieke link',
    description: 'Stuur jouw unieke link naar alle personen die uitgenodigd zijn. Zelf aantallen toevoegen is uiteraard ook mogelijk.',
  },
  {
    icon: checkbox,
    title: '3. Klaar',
    description: 'Wij verzamelen de inschrijvingen (en betalingen) en zorgen dat het eten ready-to-serve op tafel komt.',
  },
];

const whenCards = [
  {
    src: sportverenigingen,
    title: 'Sportverenigingen',
    options: ['Trainingen', 'Toernooien', "ALV's", 'Introductieweekenden', 'Wedstrijden'],
  },
  {
    src: studentenverenigingen,
    title: 'Studie- en studentenverenigingen',
    options: ['Wekelijkse borrels', 'Studeeravonden', "ALV's", 'Introductieweekenden', 'Commissie-avonden'],
  },
  {
    src: jaarclubs,
    title: 'Studentenhuizen en jaarclubs',
    options: ['Reünies', '', 'Feestjes', '', 'Huisdiners'],
  },
  {
    src: bars,
    title: 'Bars en cafés',
    description: 'Trek meer klanten door naast een pilsje een betaalbare maaltijd te faciliteren.',
  },
];

export default function LandingPage() {
  return (
    <main className="pt-16 px-4 md:px-0">
      {/* HERO SECTION */}
      <section className="text-center">
        <h1 className="text-3xl md:text-[2.75rem] md:leading-[1.3] font-medium max-w-4xl mx-auto">
          Organiseer warm avondeten voor €5,50 p.p. in{' '}
          <span className="inline-block relative">
            3
            <Image src={underline} alt="" className="absolute max-w-8 md:max-w-12 -m-1 md:-m-[6px]" />
          </span>{' '}
          minuten.
        </h1>
        <p className="text-lg md:text-2xl pt-8 max-w-xl mx-auto">
          Hoe? Start een bestelling en deel jouw unieke link. Wij verzorgen de inschrijvingen, bereiding én bezorging.
        </p>
        <div className="pt-16">
          <Link href="/list/create" className="bg-turquoise text-white rounded-lg px-16 py-3 text-lg md:text-2xl font-light hover:bg-richturquoise">
            Bestelling starten
          </Link>
        </div>
        <div className="hidden md:flex flex-col items-center relative mx-auto pt-4">
          <Image src={heroImage} alt="Hero" />
          <Image
            src={arrow}
            alt=""
            className="absolute top-2 right-0 w-24"
            style={{ transform: 'translateX(-90%)' }}
          />
          <p className="absolute -top-20 -right-1 text-lg text-black">
            Inschrijvingen open nog<br /> tot 30 minuten voor de bezorging!
          </p>
        </div>
      </section>

      {/* STATS */}
      <section className="flex flex-col md:flex-row justify-around gap-8 py-16">
        {statistics.map((stat) => (
          <div key={stat.label} className="mx-auto font-light text-center">
            <div className="flex flex-row gap-4 items-center justify-center">
              <p className="text-5xl">{stat.value}</p>
              <Image src={stat.icon} alt={stat.label} className="h-12 w-12" />
            </div>
            <p className="text-lg md:text-2xl pt-2">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* HOW SECTION */}
      <section className="py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-semibold mb-8">Hoe werkt het?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          {howSteps.map((step) => (
            <div key={step.title} className="flex flex-col items-center">
              <Image src={step.icon} alt="" className="w-24 h-24" />
              <h3 className="font-semibold pt-12">{step.title}</h3>
              <p className="font-light pt-4">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHEN SECTION */}
      <section className="py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-semibold mb-4">Wanneer?</h2>
        <p className="text-sm md:text-base mb-12 max-w-3xl mx-auto">
          Hieronder een aantal momenten waarop je SimplyMeals kunt gebruiken,<br /> maar wees vooral creatief - bijna alles is gezelliger mét lekker eten!
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-w-6xl mx-auto">
          {whenCards.map((card) => (
            <div
              key={card.title}
              className="relative rounded-3xl overflow-hidden h-44 md:h-64 text-white"
            >
              <div className="w-full h-full bg-black">
                <Image src={card.src} alt="" className="w-full h-full object-cover object-center opacity-35" />
              </div>
              <div className="absolute top-0 left-0 w-full h-full p-4 md:p-6 font-light">
                <h3 className="md:text-3xl font-semibold pb-4">{card.title}</h3>
                {card.description ? (
                  <p dangerouslySetInnerHTML={{ __html: card.description }} />
                ) : (
                  <p className="inline-grid grid-cols-2 gap-x-4">
                    {card.options?.map((option, i) => option && <span key={i}>{option}</span>)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* WHERE SECTION */}
      <section className="py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-semibold mb-4">Waar?</h2>
        <p className="text-sm md:text-base mb-8">
          Momenteel bezorgen we in en rondom de oranje steden.
        </p>
        <Image src={map} alt="Map" className="rounded-xl max-w-5xl mx-auto" />
        <p className="pt-8 font-light">
          Staat jouw regio er nog niet bij?<br />
          Laat hier je gegevens achter en wie weet bezorgen we binnenkort ook bij jou.
        </p>
        {/* You can add a form component here */}
      </section>
    </main>
  );
}
