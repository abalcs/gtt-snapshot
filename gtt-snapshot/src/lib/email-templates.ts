import { getDb } from "@/../db/database";
import { getCached, setCache } from "./data-cache";

export interface EmailTemplate {
  type: "Standard" | "Very Soon Departure" | "Long-Range Planning";
  subject?: string;
  body: string;
}

export interface DestinationTemplates {
  destination: string;
  author: string;
  templates: EmailTemplate[];
}

export interface DestinationTemplatesDoc extends DestinationTemplates {
  id: string;
  created_at: string;
  updated_at: string;
}

const COLLECTION = "email-templates";

export function slugifyDestination(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function getEmailTemplatesFromDb(): Promise<DestinationTemplates[]> {
  const cached = getCached<DestinationTemplates[]>("email-templates:all");
  if (cached) return cached;

  const snap = await getDb().collection(COLLECTION).get();

  if (snap.empty) {
    return setCache("email-templates:all", EMAIL_TEMPLATES);
  }

  const docs = snap.docs.map((d) => {
    const data = d.data();
    return {
      destination: data.destination as string,
      author: data.author as string,
      templates: (data.templates as EmailTemplate[]) || [],
    };
  });

  docs.sort((a, b) => a.destination.localeCompare(b.destination));

  return setCache("email-templates:all", docs);
}

export const EMAIL_TEMPLATES: DestinationTemplates[] = [
  {
    destination: "United Kingdom",
    author: "Sarah Ciotti",
    templates: [
      {
        type: "Standard",
        subject: "Start Planning Your Tailor-Made UK Journey with Audley Travel",
        body: `Hi {{{Recipient.FirstName}}},

Thank you for choosing Audley Travel to help create a truly unforgettable journey to the United Kingdom!

My name is Sarah, and I'm a Global Travel Advisor here at Audley. I specialize in helping clients in the early stages of planning, whether you're ready to start designing your trip or just exploring ideas. From the historic streets of London and the Cotswolds' countryside charm to Scotland's dramatic Highlands or Ireland's neighboring gems, I'm here to guide you through the possibilities and answer any questions you may have.

So, what happens next?

When you're ready, we'll start with a quick phone call to talk through your vision for your UK trip. From there, I'll connect you with one of our expert UK Country Specialists. They have deep, firsthand knowledge of the region and will work with you to design a completely tailor-made itinerary based on your interests, travel style, and pace.

Click here to schedule a call with me!

Check out what one of our clients shared after their recent UK trip with Audley:
"Our trip to England and Scotland exceeded every expectation. Audley took the time to understand exactly what we wanted and created a seamless itinerary filled with unique experiences we never would have found on our own. Every detail was handled perfectly - it truly felt like a once-in-a-lifetime trip." - Trustpilot Review, Audley Travel Client

See more testimonials from fellow travelers on why Audley Travel is their preferred tour operator.

If you'd like to get started planning your UK adventure, or simply learn more about how Audley works, let's connect!

You can schedule a call with me using the link above or reach me directly at +1 (617) 223-4366. My hours are Monday-Friday 9am-5pm EST.

Use this link to explore tour ideas for the UK & Ireland with Audley Travel.

I look forward to helping you bring your United Kingdom travel plans to life.

Best Regards,
Sarah Ciotti
Senior Global Travel Advisor
Email: Sarah.Ciotti@audleytravel.com
Phone: 617.223.4366
Audley Travel, 77 N Washington St, 4th Floor, Boston, MA 02114
Tel 1-866-346-2654   Web www.audleytravel.com
Click here to read more about our recent awards`,
      },
      {
        type: "Very Soon Departure",
        subject: "Quick Next Steps for your UK Trip - Limited Availability",
        body: `Hi {{{Recipient.FirstName}}},

Thank you for reaching out to Audley Travel about your upcoming UK trip!

Given your timeline, I recommend we connect as soon as possible - availability for the UK (especially the Cotswolds, Edinburgh, and parts of the Scottish Highlands) can become limited quickly, particularly for accommodations and private and shared experiences alike. If you're interested in specific activities and hotels, it's best if we chat ASAP so we can make sure we are able to secure your spot or find a similar alternative.

Click here to schedule a call with me!

I'm Sarah, a Global Travel Advisor here at Audley. I'll start with a quick call to understand your dates, priorities, and must-sees, then match you with one of our UK Country Specialists who will design a fully tailor-made itinerary for you.

If you're ready to move forward, I'd encourage booking a time with me today so we can secure the best options for your trip. You can schedule a call using the link above or reach me directly at +1 (617) 223-4366. My hours are Monday-Friday 9am-5pm EST.

Best Regards,
Sarah Ciotti
Senior Global Travel Advisor
Email: Sarah.Ciotti@audleytravel.com
Phone: 617.223.4366
Audley Travel, 77 N Washington St, 4th Floor, Boston, MA 02114
Tel 1-866-346-2654   Web www.audleytravel.com
Click here to read more about our recent awards

Use this link to explore tour ideas for the UK & Ireland with Audley Travel.

Check out what a recent client shared after traveling to the UK with us:
"Our trip to England and Scotland exceeded every expectation. Audley took the time to understand exactly what we wanted and created a seamless itinerary filled with unique experiences we never would have found on our own. Every detail was handled perfectly - it truly felt like a once-in-a-lifetime trip." - Trustpilot Review, Audley Travel Client

See more testimonials from fellow travelers on why Audley Travel is their preferred tour operator.`,
      },
      {
        type: "Long-Range Planning",
        subject: "Dreaming of a trip to the UK? Let's make it a reality!",
        body: `Hi {{{Recipient.FirstName}}},

Thank you for choosing Audley Travel to help create a truly unforgettable journey to the United Kingdom!

Who is Audley Travel?

Audley Travel is a full-service luxury tour operator specializing in tailor-made journeys designed exclusively for you and your private party - never group or bus tours. We handle every detail, from accommodations and curated experiences to private transfers and, if desired, international flights, ensuring a seamless and stress-free travel experience.

How can I help you?

My name is Sarah, and I'm a Global Travel Advisor here at Audley. I specialize in helping clients in the early stages of planning, whether you're ready to start designing your trip or just exploring ideas. From the historic streets of London and the Cotswolds' countryside charm to Scotland's dramatic Highlands or Ireland's neighboring gems, I'm here to guide you through the possibilities and answer any questions you may have.

So what happens next?

When you're ready, we'll start with a quick phone call to talk through your vision for your UK trip. From there, I'll connect you with one of our expert UK Country Specialists. They have deep, firsthand knowledge of the region and will work with you to design a completely tailor-made itinerary based on your interests, travel style, and pace.

Click here to schedule a call with me!

If you'd like to get started planning your UK adventure, or simply learn more about how Audley works, let's connect! It is never too early to start planning, especially when places like the Cotswolds, Edinburgh, and parts of the Scottish Highlands fill up almost a year in advance due to the limited hotel selection in these quaint towns.

You can schedule a call with me using the link above, or reach me directly at +1 (617) 223-4366. My hours are Monday-Friday 9am-5pm EST.

Use this link to explore tour ideas for the UK & Ireland with Audley Travel.

Check out what one of our clients shared after their recent UK trip with Audley:
"Our trip to England and Scotland exceeded every expectation. Audley took the time to understand exactly what we wanted and created a seamless itinerary filled with unique experiences we never would have found on our own. Every detail was handled perfectly - it truly felt like a once-in-a-lifetime trip." - Trustpilot Review, Audley Travel UK Client

See more testimonials from fellow travelers on why Audley Travel is their preferred tour operator.

I look forward to helping you bring your UK travel plans to life.`,
      },
    ],
  },
  {
    destination: "Italy",
    author: "Elizabeth",
    templates: [
      {
        type: "Standard",
        body: `Hello XXX,

My name is XXX, and I am a Global Travel Specialist here at Audley Travel :)

If you have a few minutes to chat, I'd love to get you connected with your own Italy specialist who can create a complimentary, personalized itinerary tailored just for you.

If you're more of a visual learner like me, please take a look at our Italy page for some in-depth sample itineraries that are attached below.
https://www.audleytravel.com/us/italy/tours

This can be a great source of inspiration as we start shaping your trip. There is truly something for every type of traveler in Italy, offering an incredible blend of history, culture, and unforgettable experiences at every turn.

Click here to book with me!

During our call, we can walk through your ideas, preferences, and the next steps in the planning process to bring your Italy journey to life.

I look forward to helping make this trip a reality for you!

Warm regards,`,
      },
      {
        type: "Very Soon Departure",
        body: `Hello XXX,

My name is Elizabeth, a Global Travel Specialist with Audley Travel :)

If you're considering Italy, now is the time to start planning - Italy is one of the most in-demand destinations, and top hotels, private guides, and unique experiences are booking up quickly, especially in places like Rome, Florence, the Amalfi Coast, and Venice.

I'd love to connect you with a dedicated Italy specialist who will create a personalized itinerary tailored to you, ensuring you don't miss out on the best options available for your dates.

If you'd like a bit of inspiration (and reassurance you're in good hands), please take a look at our Audley Travel reviews page here - https://www.audleytravel.com/us/about-us/reviews

Click here to schedule a quick call with me.

During our call, we'll review your ideas, preferences, and next steps so we can move quickly to secure the best accommodations and experiences before availability fills up.

Looking forward to helping bring your Italy trip to life!

Best,`,
      },
      {
        type: "Long-Range Planning",
        body: `Hello XXX,

My name is Elizabeth, and I'm a Global Travel Specialist here at Audley Travel :)

It's wonderful to hear you're considering Italy - even if your trip is a bit further out, this is actually a great time to start exploring ideas and getting inspired.

At Audley, we have dedicated Italy specialists who have an incredible depth of knowledge and firsthand experience. They're always happy to connect early in the process and guide you through the research stage - think of them as your personal "Wikipedia" for all things Italy travel.

If you'd like to start visualizing what your trip could look like, feel free to browse our Italy page for inspiration and sample itineraries:
https://www.audleytravel.com/us/italy

Whenever you're ready, I'd be happy to connect you with a specialist who can begin shaping ideas with you at your own pace.

Click here to schedule a call.

I look forward to helping you bring your future Italy adventure to life!

Best,`,
      },
    ],
  },
  {
    destination: "East Africa / Safari (Kenya-Tanzania)",
    author: "Katie",
    templates: [
      {
        type: "Standard",
        body: `Hi XXX,

Thank you for your interest in reaching out to Audley Travel to help plan your trip to Kenya/Tanzania. I just left you a voicemail but wanted to reach out via email as well. My name is Katie and I'm a Global Travel Advisor here at Audley Travel.

It looks like you are trying to plan a trip to Kenya/Tanzania this year, which falls right into the time frame I'd recommend you start planning your Kenya/Tanzania trip. I'd love to hop on a quick call to discuss your initial travel ideas further. You can book here to set up sometime to chat.

Africa is a bucket list trip for many, and the best experiences typically happen in more remote areas, allowing fewer tourists and letting you really focus on the wildlife. This also means the lodges in these locations are more intimate, providing fewer rooms. I want to help make sure that we can help bring this dream trip to fruition!`,
      },
      {
        type: "Very Soon Departure",
        body: `Hello XXX,

Thank you so much for your interest in traveling with Audley Travel! If you're ready to start chatting about your next trip to Kenya/Tanzania, feel free to schedule some time with me on my calendar: book here.

I tried to reach you via phone earlier but wasn't able to connect, so I wanted to follow up via email. My name is Katie, and I'm a Global Travel Advisor at Audley Travel. I'm here to help you at the beginning stages of planning your next trip.

If you are considering traveling to Kenya/Tanzania in the coming months, it's never too early to get a head start. I wanted to highlight that this is a particularly busy booking window for Kenya/Tanzania. We are getting close to the Great Migration (summer), one of Kenya/Tanzania's biggest draws. Availability, especially for lodging, can fill quickly - especially during one of the most sought-after times to visit. If your dates fall around this period, securing arrangements sooner rather than later can make a big difference in options and overall experience.`,
      },
      {
        type: "Long-Range Planning",
        body: `Hi XXX,

Thank you for your interest in downloading Audley's new global brochure. I see you're looking at Tanzania/Kenya and I hope this can provide you some inspiration for your next trip! I just left you a voicemail but wanted to also make sure you received this brochure via email. My name is Katie and I'm a Global Travel Advisor here at Audley Travel.

If you are interested in planning a trip at this time, we can arrange a call to speak further or you can book here to set up some time to chat. Alternatively, if you are not ready to start actively planning, we can touch base in the coming months.

Tanzania/Kenya tends to be a bucket list trip for many, so for the best safari experience I recommend booking travel to Kenya/Tanzania about 6-12 months in advance. The best safari experiences are more remote and allow fewer tourists, so availability is quite different from any other style of trip because (1) African safari trips tend to be bucket list trips that people start planning further in advance, and (2) the best lodges are more intimate and in locations where you will see fewer vehicles, with the focus being on wildlife and being in nature rather than being surrounded by thousands of other people.

If you need any further inspiration, you can check out some of these sample itineraries from our website.
Kenya Safari and Zanzibar Beach
Classic Southern Tanzania: Safari and Beach`,
      },
    ],
  },
  {
    destination: "Japan",
    author: "Delaney Lynch",
    templates: [
      {
        type: "Standard",
        body: `Hello XXX,

Thank you for choosing Audley Travel to help create an unforgettable journey to Japan!

My name is XXX, and I'm a Global Travel Advisor here at Audley. I specialize in helping travelers take the first steps toward planning meaningful, tailor-made journeys, and I'd love to learn more about what's inspiring your trip to Japan.

You can use the link below to schedule a quick 5-10 minute call with me at a time that suits you:

Click here to book a call!

From exploring Tokyo's vibrant neighborhoods, experiencing the cultural traditions of Kyoto, relaxing in a countryside ryokan, to discovering Japan off the beaten path, my role is to help you shape the big-picture vision for your trip. From there, I'll connect you with your Japan specialist, who will work closely with you to design a personalized itinerary based on your interests, travel style, and pace.

I'd love to connect and hear more about your plans for Japan. Please use the link above to schedule a call with me.

Regards,

Delaney Lynch
Global Travel Advisor
Phone: 617-223-4792
Email: delaney.lynch@audleytravel.com

Check out our Japan Page for more information, sample itineraries, and inspiration!`,
      },
      {
        type: "Very Soon Departure",
        body: `Hello XXX,

Thank you for choosing Audley Travel to help create an unforgettable journey to Japan!

My name is Delaney, and I'm a Global Travel Advisor here at Audley. I specialize in helping travelers take the first steps toward planning meaningful, tailor-made journeys, and I'd love to learn more about what's inspiring your trip to Japan.

If you are considering traveling to Japan in the coming months, it's never too early to get a head start! I wanted to highlight that this is a particularly busy booking window for Japan. Availability for top accommodations, guides, and experiences can fill up quickly - especially during cherry blossom season (spring), which is one of the most sought-after times to visit. If your dates fall around this period, securing arrangements sooner rather than later can make a big difference in options and overall experience.

You can use the link below to schedule a quick 5-10 minute call with me at a time that works best for you:

Click here to book a call!

My role is to help you quickly shape the big-picture vision for your trip - whether that includes Tokyo's energy, Kyoto's cultural heritage, or exploring more off-the-beaten-path regions. From there, I'll connect you with one of our Japan specialists, who will work with you to design a personalized itinerary that fits your timing, interests, and priorities.

Please feel free to check out our Audley Travel Reviews page to see what our clients are saying about their experiences in Japan! You may find some ideas for your own travels, and it's a great way to see what makes our trips so special.

Let's bring this Japan trip to life!

Best Regards,
Delaney Lynch
Global Travel Advisor
Phone: 617-223-4792
Email: delaney.lynch@audleytravel.com`,
      },
      {
        type: "Long-Range Planning",
        body: `Hello XXX,

My name is Delaney, and I'm a Global Travel Advisor here at Audley.

It's so exciting to hear you're considering Japan! Even if your trip is a bit further out, it's never too soon to start exploring ideas and getting inspired.

At Audley, our Japan Specialists design tailor-made itineraries crafted entirely around your travel preferences. With deep, firsthand knowledge of Japan, they bring the country to life in a way that goes far beyond a standard trip. Each journey is thoughtfully planned to include handpicked accommodations, seamless in-country transfers, private guided tours, and curated excursions. We consider every detail, so you can experience Japan in a way that feels personal, immersive, and effortless.

If you'd like to start visualizing what your trip with us could look like, feel free to browse our Japan page for information, sample itineraries, and inspiration!

Whenever you're ready, I'd be happy to connect you with a Japan Specialist who can begin shaping ideas with you at your own pace. In the meantime, I'm here as a resource for any questions you may have about working with Audley. You can use the link below to schedule a quick 5-10 minute call with me at a time that suits you:

Click here to schedule a call!

If you'd like to see what our clients think of their travels to Japan with us, visit our Audley Travel Reviews page to see what makes our trips so special. We're proud to offer an award-winning level of service that's grown a community of like-minded travel enthusiasts - many of whom travel with us year after year.

I look forward to helping you bring your Japan adventure to life!

Best regards,

Delaney Lynch
Global Travel Advisor
Phone: 617-223-4792
Email: delaney.lynch@audleytravel.com

Check out our brand new Audley Travel Brochure to check out all of our destinations and trip inspo!`,
      },
    ],
  },
  {
    destination: "Australia",
    author: "Lexi Marinos",
    templates: [
      {
        type: "Standard",
        subject: "Let's start planning your trip to Australia!",
        body: `Hi X,

Thanks so much for reaching out about Australia - such an incredible place to explore. Australia is one of our top destinations and experiencing a ton of demand for travelers wanting to experience the famous wildlife, stunning scenery, dynamic food scene, and energizing events that have our clients booking their trips far in advance.

The best next step is a quick call so I can learn more about what you're envisioning and walk you through how we design our trips. From there, I'll pair you with one of our Australia specialists who will collaborate with you to create a fully customized itinerary based on your interests.

You can grab a time that works best for you here: [Insert booking cal link]

If it's easier, feel free to reply with a bit more detail around timing or what you're thinking, and I can guide things from there - but a quick conversation is usually the most helpful place to start.

Looking forward to connecting!

Best,
Lexi`,
      },
      {
        type: "Very Soon Departure",
        subject: "Limited Availability: Australia trip planning",
        body: `Hi X,

Thanks so much for reaching out - Australia is an amazing choice.

With your travel dates coming up soon, the best next step is to connect briefly so I can understand your plans and quickly match you with one of our Australia specialists to check availability and start shaping your trip. Our specialists have their finger on the pulse for stellar properties and exciting tours and experiences across Australia that still have availability for your dates and can be an amazing partner in making your dream a reality.

You can schedule a time that works best for you here: [Insert booking cal link]

If you happen to have your dates and travel details handy, feel free to include them when booking or reply here - but we can also go through everything together on the call and move things forward right away.

Looking forward to helping you get this underway!

Best,
Lexi`,
      },
      {
        type: "Long-Range Planning",
        subject: "Let's start planning your tailor-made journey to Australia!",
        body: `Hi X,

Thanks so much for reaching out - Australia is such a special destination, and planning ahead gives us the opportunity to create something really thoughtful and personalized. Whether it is Sydney for New Year's Eve, watching sunset at Uluru in the heart of the Outback, or snorkeling right off island beaches in the Great Barrier Reef, Australia's most iconic experiences are in high demand and can book up over a year in advance.

I'd recommend starting with a quick call so I can learn more about what you're looking for and walk you through how we approach designing trips. From there, I'll connect you with one of our Australia specialists who will share their specialized expertise in the country to work with you on building out your dream itinerary.

You can schedule a time that works best for you here: [Insert booking cal link]

If you'd prefer to share a few initial thoughts over email first, that's absolutely fine too - but most clients find a quick conversation is the easiest way to get started.

Excited to connect!

Best,
Lexi Marinos
Senior Global Travel Advisor
Email: lexi.marinos@audleytravel.com
Direct: +1 617-223-4719
Please click HERE to schedule an appointment with me.`,
      },
    ],
  },
];
