/* ============================================================
   GRÜNE HÖLLE ACADEMY — Datenbasis

   Streckenverlauf, Kurvenpositionen und Kilometrierung stammen aus
   OpenStreetMap (© OpenStreetMap-Mitwirkende, ODbL) und stehen in
   js/geo.js. Dort ist die Nordschleife in ihre benannten Abschnitte
   zerlegt — die Kurven sitzen an ihrer echten geografischen Position.

   Bremspunkte, Gänge, Geschwindigkeiten und Höhenangaben sind
   Richtwerte für ein GT3-artiges Fahrzeug bzw. gerundete Schätzungen.
   ============================================================ */

const ND = {};

ND.meta = {
  laengeNordschleife: 20.832,
  laengeGesamtstrecke: 24.358,
  hoehenunterschied: 300,
  hoechsterPunkt: { name: 'Hohe Acht', m: 617 },
  tiefsterPunkt: { name: 'Breidscheid', m: 320 },
  kurvenGesamt: 73,
  eroeffnung: '18. Juni 1927',
  disclaimer:
    'Streckenverlauf und Kilometrierung basieren auf OpenStreetMap-Daten. ' +
    'Bremspunkte, Gänge und Geschwindigkeiten sind Richtwerte für ein GT3-artiges Fahrzeug ' +
    'und verschieben sich je nach Auto, Setup, Reifen und Wetter.'
};

/* ---------- Abschnitte ---------- */
ND.sectors = [
  { id: 'gp', name: 'GP-Strecke', short: 'GP', color: '#8b9dc3',
    desc: 'Der moderne Grand-Prix-Kurs. Bei NLS und 24h wird die Mercedes-Arena über die "Variante 24h-Rennen" ausgelassen.' },
  { id: 's1', name: 'Hatzenbach & Flugplatz', short: 'S1', color: '#4ade80',
    desc: 'Rhythmus-Sektion. Enge Esses, dann der schnelle Ritt über Quiddelbacher Höhe und Flugplatz. Hier verlierst du Zeit durch Hektik, nicht durch fehlenden Mut.' },
  { id: 's2', name: 'Fuchsröhre & Adenau', short: 'S2', color: '#60a5fa',
    desc: 'Vom schnellsten Downhill der Strecke bis runter nach Breidscheid — dem tiefsten Punkt. Bergab, blind, unversöhnlich.' },
  { id: 's3', name: 'Bergwerk & Karussell', short: 'S3', color: '#f59e0b',
    desc: 'Der lange Anstieg. Kesselchen als Erholung für den Fahrer, Höllenritt für den Motor. Danach das Karussell und hoch zur Hohen Acht.' },
  { id: 's4', name: 'Pflanzgarten & Schwalbenschwanz', short: 'S4', color: '#f472b6',
    desc: 'Die Achterbahn. Sprünge, Kompressionen, Blindkuppen. Der Abschnitt, der die meisten Autos frisst.' },
  { id: 's5', name: 'Döttinger Höhe', short: 'S5', color: '#ef4444',
    desc: 'Vollgas. Über zwei Kilometer flach, dann Antoniusbuche, Tiergarten und die Hohenrain-Schikane zurück auf die GP-Strecke.' }
];

/* ---------- Kurven ----------
   Position (x, y) und km kommen aus js/geo.js und werden von
   ND.applyGeo() eingesetzt.
   dir : L=links, R=rechts, S=S-Kombination, G=Gerade/Passage
   bp  : idealer Bremspunkt in Metern (null = keine echte Bremsung)
   alt : ungefähre Höhe über dem Meer in Metern
   risk: 1 (harmlos) bis 5 (Streckenposten-Stammkunde)
   quiz: false = taucht in den Minispielen nicht als Frage auf
------------------------------------------------- */
ND.corners = [
  /* ===== GP-STRECKE ===== */
  { id:'gp_sf', nr:1, name:'Start/Ziel GP', alias:'Start-Ziel-Gerade', sec:'gp', alt:600,
    dir:'G', gear:'6', spd:'~260 km/h', bp:null, risk:1,
    desc:'Die breite GP-Gerade mit der Boxengasse daneben. Bei NLS und 24h beginnt und endet hier die Runde — nach 24,358 km.',
    tip:'Der Ort für Windschatten. Die Bremszone in die erste Kurve ist breit genug für drei Autos — was nicht heißt, dass es klug ist.',
    ac:'Auf dem Nordschleife-Tourist-Layout gibt es diesen Teil nicht, dort startest du bei T13. Achte darauf, welches Layout dein Mod hat.',
    fact:'Die GP-Strecke wurde 1984 eröffnet, nachdem die Nordschleife für die Formel 1 zu gefährlich geworden war.',
    spot:'Haupttribünen. Bester Blick auf Boxenstopps und Fahrerwechsel — und der einzige Ort mit Videowall und Zeitmonitor.' },

  { id:'gp_t1', nr:2, name:'Yokohama-Kurve', alias:'T1, früher Castrol-S', sec:'gp', alt:595,
    dir:'R', gear:'2-3', spd:'~90 km/h', bp:100, risk:2,
    desc:'Erste Kurve nach Start/Ziel, harte Verzögerung vom Topspeed herunter.',
    tip:'Spät einlenken, die Kurve öffnet sich am Ausgang. Klassische Stelle für Startunfälle in Runde 1.',
    ac:'Guter Bremsbalance-Test: wandert das Heck hier, ist die Balance zu weit hinten.',
    fact:'Wie fast alle GP-Kurven trägt sie einen Sponsorennamen, der über die Jahre wechselt.',
    spot:'Sehr gut von den Tribünen einsehbar.' },

  { id:'gp_arena', nr:3, name:'Mercedes-Arena', alias:'Südschleife des GP-Kurses', sec:'gp', alt:590,
    dir:'S', gear:'2-3', spd:'~80 km/h', bp:80, risk:2,
    desc:'Die 2002 gebaute Stadionsektion im Süden des GP-Kurses. Enge Kehren zwischen steilen Tribünen.',
    tip:'Bei NLS und 24h fährst du hier gar nicht durch — das Feld nimmt die Abkürzung. Bei GP-Rennen ist es die Überholzone schlechthin.',
    ac:'Wenn dein Mod die Mercedes-Arena enthält, fährst du das GP-Layout, nicht das NLS-Layout.',
    fact:'Die Arena entstand 2002 und machte die GP-Strecke rund 500 Meter länger.',
    spot:'Steile Tribünen rundherum — der beste Platz für Überholmanöver aus nächster Nähe.' },

  { id:'gp_variante', nr:4, name:'Variante 24h-Rennen', alias:'die NLS-Abkürzung', sec:'gp', alt:592, quiz:false,
    dir:'S', gear:'3', spd:'~110 km/h', bp:60, risk:2,
    desc:'Das kurze Verbindungsstück, mit dem NLS und 24h die Mercedes-Arena umfahren. Es zweigt kurz vor der Arena ab und mündet direkt auf den Rückweg.',
    tip:'Deshalb ist die NLS-Runde mit 24,358 km kürzer als GP-Strecke plus Nordschleife zusammen wären.',
    ac:'Wenn dein Layout hier abkürzt, hast du das richtige NLS/24h-Layout erwischt.',
    fact:'In OpenStreetMap heißt dieses Teilstück tatsächlich "Variante 24h-Rennen".',
    spot:null },

  { id:'gp_sponsoren', nr:5, name:'Rückweg zur Schikane', alias:'Ford-Kurve, Dunlop-Kehre, Bit-Kurve, Advan-Bogen', sec:'gp', alt:580, quiz:false,
    dir:'S', gear:'3-4', spd:'~140 km/h', bp:80, risk:2,
    desc:'Der lange Rückweg zur Schlussschikane. Auf diesem Stück liegen mehrere Kurven, die alle Sponsorennamen tragen — Ford-Kurve, Dunlop-Kehre, Bit-Kurve, Advan-Bogen und weitere.',
    tip:'Genau hier lohnt der Blick in den offiziellen Streckenplan deines Rennwochenendes: die Namen wechseln mit den Sponsorenverträgen, die Kurven bleiben.',
    ac:'Im Sim ist das der Abschnitt, an dem du Übersetzung und Aero-Kompromiss für den GP-Teil prüfst.',
    fact:'Frag drei Leute im Fahrerlager nach den Namen dieser Kurven und du bekommst vier Antworten — je nachdem, wann sie angefangen haben, hierher zu kommen.',
    spot:'Von den Tribünen im GP-Bereich gut einsehbar.' },

  { id:'gp_ngk', nr:6, name:'NGK-Schikane', alias:'Schlussschikane, früher Veedol-Schikane', sec:'gp', alt:575,
    dir:'S', gear:'2', spd:'~70 km/h', bp:100, risk:3,
    desc:'Die letzte Schikane vor Start/Ziel. Enger Links-Rechts-Knick mit hohen Kerbs.',
    tip:'Der klassische Last-Lap-Überholpunkt. Innen anbremsen funktioniert, den Ausgang gewinnst du damit aber selten.',
    ac:'Über den ersten Kerb darfst du meist, über den zweiten nicht — klassische Track-Limit-Falle.',
    fact:'In der 24h-Nacht ist das eine der Stellen, an denen müde Fahrer plötzlich sehr kreativ werden.',
    spot:'Top-Zuschauerplatz — Bremsduelle aus nächster Nähe, zu Fuß vom Fahrerlager erreichbar.' },

  { id:'gp_zufahrt', nr:7, name:'Zufahrt Nordschleife', alias:'Anbindung GP → Nordschleife', sec:'gp', alt:600, quiz:false,
    dir:'G', gear:'5-6', spd:'~200 km/h', bp:null, risk:1,
    desc:'Das Verbindungsstück von der GP-Strecke hinauf zur Nordschleife. Ab hier beginnt die Grüne Hölle.',
    tip:'Letzte Gelegenheit, den Kopf freizubekommen. Ab jetzt 20,8 km ohne Auslauf.',
    ac:'Auf dem 24h-Layout ist das der Übergang, auf dem Tourist-Layout gibt es ihn nicht.',
    fact:'Die NLS-Runde ist mit 24,358 km rund 3,5 km länger als die reine Nordschleife.',
    spot:null },

  /* ===== S1 — HATZENBACH & FLUGPLATZ ===== */
  { id:'ns_start', nr:8, name:'Nordschleife Start', alias:'T13', sec:'s1', alt:600,
    dir:'G', gear:'6', spd:'~240 km/h', bp:null, risk:1,
    desc:'Startpunkt der klassischen 20,832-km-Runde. Hier laufen alle Nordschleifen-Zeiten los — auch die berühmten BTG-Zeiten der Touristenfahrer.',
    tip:'Nach der Kuppe wird die Strecke schmal. Blick weit nach vorn, die Sabine-Schmitz-Kurve kommt schnell.',
    ac:'Deine Rundenzeit startet hier, wenn du das Tourist-Layout fährst.',
    fact:'BTG steht für "Bridge to Gantry" — die inoffizielle Messstrecke der Touristenfahrer, weil eine offizielle Zeitnahme dort verboten ist.',
    spot:null },

  { id:'sabine_schmitz', nr:9, name:'Sabine-Schmitz-Kurve', alias:null, sec:'s1', alt:598,
    dir:'R', gear:'4-5', spd:'~160 km/h', bp:60, risk:2,
    desc:'Schneller Rechtsbogen kurz nach dem Start, benannt nach der "Königin der Nordschleife".',
    tip:'Fließend nehmen — sie leitet in den Hatzenbogen über und bestimmt deine Position für die gesamte Hatzenbach-Sektion.',
    ac:'Erster Rhythmus-Check der Runde. Wer hier schon korrigiert, kommt in Hatzenbach nie sauber durch.',
    fact:'Benannt nach Sabine Schmitz, zweifache 24h-Siegerin und über Jahrzehnte das Gesicht der Nordschleife.',
    spot:null },

  { id:'hatzenbach_bogen', nr:10, name:'Hatzenbogen', alias:'Einfahrt Hatzenbach', sec:'s1', alt:590,
    dir:'R', gear:'4', spd:'~150 km/h', bp:80, risk:2,
    desc:'Schneller Rechtsbogen, der dich in die Hatzenbach-Esses wirft.',
    tip:'Zu weit außen rein und du bist für die komplette Sektion aus dem Rhythmus. Der Bogen bestimmt die nächsten 30 Sekunden.',
    ac:'Wenn dein Setup hier schon nervös wirkt, wird Hatzenbach zur Qual.',
    fact:null, spot:null },

  { id:'hatzenbach', nr:11, name:'Hatzenbach', alias:'die Esses', sec:'s1', alt:575,
    dir:'S', gear:'3-4', spd:'~120 km/h', bp:60, risk:3,
    desc:'Eine Kette enger Links-Rechts-Wechsel, teils blind, teils bergab. Der erste echte Rhythmustest der Runde.',
    tip:'Nicht Kurve für Kurve fahren, sondern als eine einzige Bewegung. Wer hier zu viel lenkt, verliert überall.',
    ac:'Der Klassiker zum Üben: 15 Minuten nur Hatzenbach fahren, bis die Sequenz im Muskelgedächtnis sitzt.',
    fact:'In der ersten Rennrunde der 24h ist Hatzenbach eine der größten Stau- und Chaoszonen des Jahres.',
    spot:'Von außen kaum einsehbar, für Zuschauer schlecht geeignet.' },

  { id:'hocheichen', nr:12, name:'Hocheichen', alias:null, sec:'s1', alt:570,
    dir:'R', gear:'4', spd:'~140 km/h', bp:70, risk:3,
    desc:'Rechtskurve mit Kuppe, danach fällt die Strecke ab. Der Ausgang ist blind und die Strecke fällt weg.',
    tip:'Nicht am Scheitelpunkt gierig werden — beim Herausbeschleunigen wird das Auto leicht und schiebt gern nach außen.',
    ac:'Gute Stelle, um zu prüfen, ob deine Federung Kompressionen wegsteckt.',
    fact:null, spot:null },

  { id:'quiddelbacher', nr:13, name:'Quiddelbacher Höhe', alias:'Anfahrt Flugplatz', sec:'s1', alt:590,
    dir:'G', gear:'5', spd:'~200 km/h', bp:null, risk:3,
    desc:'Schnelle Kuppe, über die es Richtung Flugplatz geht. Das Auto wird leicht, teils hebt es ab.',
    tip:'Lenkrad gerade halten, wenn es leicht wird. Jede Korrektur in der Luft wird bei der Landung bezahlt.',
    ac:'Hier merkst du sofort, ob dein Mod eine brauchbare Aero- und Federungssimulation hat.',
    fact:'Der Name kommt vom benachbarten Ort Quiddelbach.',
    spot:null },

  { id:'flugplatz', nr:14, name:'Flugplatz', alias:null, sec:'s1', alt:570,
    dir:'R', gear:'5-6', spd:'~220 km/h', bp:null, risk:4,
    desc:'Sehr schneller Rechtsknick über zwei Kuppen. Der Name ist Programm: das Auto wird leicht, und zwar genau beim Einlenken.',
    tip:'Vollgas ist möglich — aber nur mit sauberer Anfahrt. Wer korrigiert, während die Räder entlastet sind, fliegt.',
    ac:'Eine der besten Mut-Referenzen: wenn du Flugplatz voll fährst, sitzt dein Rhythmus.',
    fact:'Der Name stammt vom nahegelegenen Flugplatz, nicht von fliegenden Autos — auch wenn beides passt.',
    spot:'Zuschauerbereiche vorhanden, spektakuläre Highspeed-Bilder.' },

  { id:'kottenborn', nr:15, name:'Kottenborn', alias:null, sec:'s1', alt:560,
    dir:'L', gear:'5', spd:'~190 km/h', bp:null, risk:2,
    desc:'Schneller Linksknick auf dem Weg zum Schwedenkreuz, benannt nach dem nahen Ort.',
    tip:'Fließend nehmen, nicht abbremsen. Es ist ein Knick, keine Kurve.',
    ac:null, fact:'Benannt nach der Ortschaft Kottenborn.', spot:null },

  { id:'schwedenkreuz', nr:16, name:'Schwedenkreuz', alias:null, sec:'s1', alt:555,
    dir:'L', gear:'6', spd:'~250 km/h', bp:null, risk:5,
    desc:'Extrem schneller Linksbogen bergab. Eine der schnellsten Passagen der Nordschleife — und eine der gefährlichsten.',
    tip:'Volle Konzentration, keine Lenkkorrektur. Hier passieren die schwersten Unfälle der Strecke, weil ein Fehler bei 250 km/h keine Verzeihung kennt.',
    ac:'Auch im Sim die Stelle, an der du am meisten Respekt lernst. Nicht zum Warmfahren nutzen.',
    fact:'Der Name kommt von einem Steinkreuz am Streckenrand, das an einen im 17. Jahrhundert gestorbenen schwedischen Reiter erinnern soll.',
    spot:'Zuschauerbereich vorhanden — brutale Geschwindigkeitswahrnehmung, Pflichtbesuch bei NLS.' },

  /* ===== S2 — FUCHSRÖHRE & ADENAU ===== */
  { id:'aremberg', nr:17, name:'Aremberg', alias:null, sec:'s2', alt:540,
    dir:'R', gear:'3-4', spd:'~120 km/h', bp:150, risk:3,
    desc:'Rechtskurve nach dem Highspeed-Anlauf vom Schwedenkreuz. Harte Bremsung, die Strecke fällt ab.',
    tip:'Der Bremspunkt liegt gefühlt viel zu früh — das täuscht wegen der hohen Anfahrtsgeschwindigkeit. Lieber einmal zu früh als einmal in die Leitplanke.',
    ac:'Braucht ein Setup, das beim Bergab-Bremsen stabil bleibt.',
    fact:'Benannt nach dem nahegelegenen Berg und dem Adelsgeschlecht Arenberg.',
    spot:'Guter Zuschauerpunkt mit Bremsduellen.' },

  { id:'fuchsroehre', nr:18, name:'Fuchsröhre', alias:'Foxhole', sec:'s2', alt:470,
    dir:'S', gear:'5-6', spd:'~240 km/h', bp:null, risk:5,
    desc:'Die legendäre Abfahrt: steil bergab durch den Wald, unten eine heftige Kompression, dann sofort wieder bergauf. Vollgas, blind, sehr schnell.',
    tip:'Unten drückt es dich in den Sitz und das Auto auf die Federn — dort NICHT lenken. Wer im Tal korrigiert, verliert die Kontrolle.',
    ac:'Der beste Test für dein Federungs-Setup. Zu hart und das Auto springt, zu weich und du setzt auf.',
    fact:'Der Name kommt vom röhrenartigen Waldeinschnitt. Für viele Fahrer die eindrucksvollste Passage der ganzen Strecke.',
    spot:'Kein regulärer Zuschauerzugang — die Fuchsröhre erlebt man nur im Auto oder im TV.' },

  { id:'adenauer_forst', nr:19, name:'Adenauer Forst', alias:null, sec:'s2', alt:505,
    dir:'S', gear:'2-3', spd:'~80 km/h', bp:150, risk:4,
    desc:'Nach dem Anstieg aus der Fuchsröhre: brutale Bremsung in eine enge Links-Rechts-Kombination. Kies links und rechts.',
    tip:'Der Bremspunkt kommt nach einer schnellen Passage — man ist gefühlt immer zu schnell. Erst links anbremsen, dann sauber auf rechts umsetzen.',
    ac:'Klassische Stelle für Kies-Ausflüge. Wenn das Auto beim Umsetzen hüpft, stimmt die Bremsbalance nicht.',
    fact:'Einer der beliebtesten Zuschauerplätze der Grünen Hölle — hier gibt es fast in jedem Rennen Dreher.',
    spot:'TOP-Spot. Nah dran, viele Fehler, klassische Kies-Show. Für NLS und 24h sehr empfehlenswert.' },

  { id:'metzgesfeld', nr:20, name:'Metzgesfeld', alias:null, sec:'s2', alt:495,
    dir:'L', gear:'4', spd:'~140 km/h', bp:70, risk:3,
    desc:'Zwei Linkskurven bergab, die zweite deutlich enger als die erste.',
    tip:'Die erste Linke ist ein Bogen, die zweite eine echte Kurve. Wer beide gleich behandelt, verpasst die zweite.',
    ac:null, fact:null, spot:null },

  { id:'kallenhard', nr:21, name:'Kallenhard', alias:null, sec:'s2', alt:455,
    dir:'R', gear:'3', spd:'~100 km/h', bp:120, risk:3,
    desc:'Enge Rechtskurve bergab, mit fieser Bodenwelle am Ausgang.',
    tip:'Spät einlenken, spät aufs Gas. Die Bodenwelle am Ausgang schickt dich sonst zur Leitplanke.',
    ac:'Gute Referenz für die Dämpferabstimmung: nach der Welle soll das Auto sofort wieder ruhig sein.',
    fact:null, spot:'Zuschauerbereich vorhanden.' },

  { id:'spiegelkurve', nr:22, name:'Spiegelkurve', alias:null, sec:'s2', alt:430,
    dir:'L', gear:'3', spd:'~110 km/h', bp:60, risk:2,
    desc:'Linkskurve bergab auf dem Weg nach Wehrseifen.',
    tip:'Nicht überfahren — der folgende Abschnitt ist eng und du brauchst die Linie.',
    ac:null,
    fact:'Der Name geht auf einen Spiegel zurück, der Fahrern früher die Sicht um die Kurve ermöglichen sollte.',
    spot:null },

  { id:'misshitmiss', nr:23, name:'Dreifach-Rechts', alias:'Miss-Hit-Miss', sec:'s2', alt:415,
    dir:'S', gear:'3', spd:'~110 km/h', bp:null, risk:3,
    desc:'Drei schnelle Rechtsbögen hintereinander mit engem Streckenrand. Der englische Spitzname sagt alles über die Trefferquote.',
    tip:'Mittig bleiben, nicht jeden Scheitelpunkt jagen. Hier gewinnst du kaum Zeit, aber du kannst viel verlieren.',
    ac:null,
    fact:'Den Spitznamen "Miss-Hit-Miss" prägten britische Fahrer: danebentreffen, treffen, danebentreffen.',
    spot:null },

  { id:'wehrseifen', nr:24, name:'Wehrseifen', alias:null, sec:'s2', alt:395,
    dir:'R', gear:'2', spd:'~60 km/h', bp:120, risk:4,
    desc:'Sehr enge, langsame Rechtskurve bergab. Die Strecke fällt beim Bremsen weg, direkt danach geht es steil hinunter nach Breidscheid.',
    tip:'Eine der schwersten Bremsungen der Runde, weil das Auto bergab kaum Grip hat. Früh runterbremsen, sauber einlenken.',
    ac:'Kommt das Heck beim Anbremsen: Bremsbalance nach vorn oder weniger Motorbremse.',
    fact:'Einer der langsamsten Punkte der Nordschleife.',
    spot:'Sehr guter Zuschauerplatz — langsam, nah, viele Fehler.' },

  { id:'breidscheid', nr:25, name:'Breidscheid', alias:'Adenauer Brücke', sec:'s2', alt:320,
    dir:'S', gear:'2-3', spd:'~80 km/h', bp:100, risk:4,
    desc:'Der tiefste Punkt der Strecke, direkt an der Brücke über den Adenauer Bach. Die Strecke führt hier faktisch durch das Dorf.',
    tip:'Eng, und die Leitplanke ist unversöhnlich. Nicht auf Kurvenausgangs-Speed spielen, hier zählt Sauberkeit.',
    ac:'Auf rund 320 m Höhe — knapp 300 Meter tiefer als die Hohe Acht. In echt ändert sich hier sogar die Motorleistung merklich.',
    fact:'Breidscheid ist ein Ortsteil von Adenau.',
    spot:'Legendärer Zuschauerplatz mit direktem Blick auf die Brücke. Bei 24h sehr beliebt.' },

  { id:'exmuehle', nr:26, name:'Ex-Mühle', alias:'Exmühle', sec:'s2', alt:330,
    dir:'R', gear:'2-3', spd:'~85 km/h', bp:80, risk:3,
    desc:'Rechtskurve direkt nach der Brücke, an der ehemaligen Mühle. Ab hier geht es wieder bergauf.',
    tip:'Der Ausgang ist der Start des langen Anstiegs — Traktion ist wichtiger als Kurvenspeed.',
    ac:'Wenn hier die Räder durchdrehen, verlierst du bis zum Bergwerk permanent Zeit.',
    fact:'Der Name erinnert an eine Mühle, die früher an dieser Stelle stand.',
    spot:'Vom Breidscheid-Bereich mit einsehbar.' },

  { id:'lauda_links', nr:27, name:'Lauda-Links', alias:null, sec:'s2', alt:335,
    dir:'L', gear:'3', spd:'~120 km/h', bp:60, risk:3,
    desc:'Linkskurve im Anstieg kurz vor dem Bergwerk — benannt nach Niki Lauda.',
    tip:'Sauber halten, der Ausgang leitet direkt in die Bergwerk-Anbremszone.',
    ac:null,
    fact:'Benannt nach Niki Lauda, der 1976 ganz in der Nähe schwer verunglückte.',
    spot:null },

  /* ===== S3 — BERGWERK & KARUSSELL ===== */
  { id:'bergwerk', nr:28, name:'Bergwerk', alias:null, sec:'s3', alt:345,
    dir:'R', gear:'2-3', spd:'~90 km/h', bp:120, risk:4,
    desc:'Enge Rechtskurve am Fuß des langen Anstiegs. Der Ausgang bestimmt deine Geschwindigkeit für das komplette Kesselchen.',
    tip:'Die wichtigste Kurve für die Rundenzeit im Mittelteil: alles, was du hier am Ausgang verlierst, ziehst du über einen Kilometer hinter dir her.',
    ac:'Traktionstest. Hier zu früh voll aufs Gas heißt Dreher.',
    fact:'Hier verunglückte Niki Lauda 1976 im Ferrari schwer — der Unfall, der das Ende der Formel 1 auf der Nordschleife besiegelte.',
    spot:'Zuschauerplatz mit historischem Gewicht.' },

  { id:'senkenlinks', nr:29, name:'Senkenlinks', alias:null, sec:'s3', alt:360,
    dir:'L', gear:'4-5', spd:'~170 km/h', bp:null, risk:3,
    desc:'Schneller Linksbogen durch eine Senke, direkt nach dem Bergwerk.',
    tip:'Die Kompression in der Senke drückt das Auto auf die Federn — nicht gleichzeitig lenken und bremsen.',
    ac:null, fact:null, spot:null },

  { id:'kesselchen', nr:30, name:'Kesselchen', alias:null, sec:'s3', alt:385,
    dir:'G', gear:'5-6', spd:'~230 km/h', bp:null, risk:2,
    desc:'Langer, schneller Anstieg mit weiten Bögen. Fast durchgehend Vollgas — eine der wenigen Stellen, an denen der Fahrer durchatmen kann.',
    tip:'Nutz die Zeit: Spiegel checken, Position im Feld einschätzen, Systeme kontrollieren. Im Rennen ist das dein Büro.',
    ac:'Ideal, um Topspeed und Übersetzung zu prüfen. Läufst du hier in den Begrenzer, ist die Übersetzung zu kurz.',
    fact:'Für den Motor eine der härtesten Passagen der Runde — langer Volllastbetrieb bergauf.',
    spot:null },

  { id:'mutkurve', nr:31, name:'Mutkurve', alias:null, sec:'s3', alt:405,
    dir:'L', gear:'5', spd:'~200 km/h', bp:null, risk:3,
    desc:'Schneller Linksbogen im Kesselchen-Anstieg. Der Name ist eine Ansage.',
    tip:'Voll oder fast voll — je nach Auto. Der Mut ist die eigentliche Herausforderung, nicht die Technik.',
    ac:null, fact:'Der Name sagt genau das, was du brauchst.', spot:null },

  { id:'klostertal', nr:32, name:'Klostertal', alias:'Klostertal-Kehre', sec:'s3', alt:440,
    dir:'R', gear:'2-3', spd:'~80 km/h', bp:150, risk:3,
    desc:'Am Ende des langen Vollgas-Anstiegs: harte Bremsung in eine enge Doppel-Rechts.',
    tip:'Nach über einem Kilometer Vollgas fühlt sich jeder Bremspunkt zu früh an. Vertraue der Referenz, nicht dem Bauchgefühl.',
    ac:'Bremsentemperatur-Check: hier merkst du, ob die Bremsen nach dem langen Vollgasstück ausgekühlt sind.',
    fact:null, spot:'Guter Zuschauerplatz mit Bremsduellen.' },

  { id:'steilstrecke', nr:33, name:'Steilstrecke', alias:'Zufahrt Steilstrecke', sec:'s3', alt:460,
    dir:'G', gear:'3-4', spd:'~130 km/h', bp:null, risk:2,
    desc:'Kurzes Verbindungsstück hoch zum Karussell, an dem die historische Steilstrecke abzweigt.',
    tip:'Rechts halten — das Karussell kommt schnell und die Einfahrt ist blind.',
    ac:null,
    fact:'Die Steilstrecke ist ein historischer Prüfstreckenabschnitt mit bis zu 27 % Steigung — heute nicht mehr Teil der Rennstrecke.',
    spot:null },

  { id:'karussell', nr:34, name:'Caracciola-Karussell', alias:'das Karussell, großes Karussell', sec:'s3', alt:520,
    dir:'R', gear:'2', spd:'~55 km/h', bp:80, risk:3,
    desc:'DIE Ikone der Nordschleife: eine steilwandige Betonschüssel, in die man das Auto hineinfallen lässt. Der Wagen kippt, die Fliehkraft presst dich in den Sitz.',
    tip:'Reinfallen lassen, Lenkrad ruhig, konstant Gas. Wer oben am Rand entlangfährt, verliert Zeit und riskiert einen Ausflug. Innen in den Beton — dafür ist er da.',
    ac:'Im Sim rappelt es hier heftig. Nicht gegenlenken, das Auto folgt der Schüssel von selbst.',
    fact:'Benannt nach Rudolf Caracciola. Die Betonschüssel entstand ursprünglich aus einem Entwässerungsgraben, den findige Fahrer als schnellere Linie entdeckten.',
    spot:'Der berühmteste Zuschauerplatz der Welt. Autos kippen direkt vor dir in die Schüssel — Pflichtprogramm bei NLS und 24h.' },

  { id:'hohe_acht', nr:35, name:'Hohe Acht', alias:null, sec:'s3', alt:617,
    dir:'R', gear:'3', spd:'~110 km/h', bp:80, risk:3,
    desc:'Der höchste Punkt der Strecke, 617 m über dem Meer. Steil bergauf in eine Rechtskurve, dann Kuppe und Abfahrt.',
    tip:'Bergauf hast du viel Grip, am Kuppenausgang schlagartig weniger. Das Gaspedal beim Überfahren der Kuppe kurz beruhigen.',
    ac:'Rund 300 Höhenmeter über Breidscheid — dazwischen liegen nur gut vier Kilometer Strecke.',
    fact:'Benannt nach dem gleichnamigen Berg, dem höchsten der Eifel-Region rund um den Ring.',
    spot:'Zuschauerbereich mit Weitblick.' },

  /* ===== S4 — PFLANZGARTEN & SCHWALBENSCHWANZ ===== */
  { id:'hedwigshoehe', nr:36, name:'Hedwigshöhe', alias:null, sec:'s4', alt:600,
    dir:'L', gear:'4', spd:'~150 km/h', bp:null, risk:3,
    desc:'Schnelle Linkskurve direkt nach der Hohen Acht, bergab.',
    tip:'Kommt sofort nach der Kuppe — wer gedanklich noch bei der Hohen Acht ist, kommt hier zu spät.',
    ac:null, fact:null, spot:null },

  { id:'wippermann', nr:37, name:'Wippermann', alias:null, sec:'s4', alt:585,
    dir:'S', gear:'3', spd:'~110 km/h', bp:80, risk:3,
    desc:'Enge Rechts-Links-Kombination bergab mit Kompression im Tal.',
    tip:'Bergab-Bremsung mit wenig Auflagedruck. Das Auto ist hier leicht — vorsichtig mit dem Gas am Ausgang.',
    ac:null, fact:null, spot:null },

  { id:'eschbach', nr:38, name:'Eschbach', alias:null, sec:'s4', alt:570,
    dir:'R', gear:'3-4', spd:'~130 km/h', bp:60, risk:3,
    desc:'Rechtskurve im welligen Abschnitt vor Brünnchen.',
    tip:'Sauber positionieren — der ganze Abschnitt bis Brünnchen ist ein Rhythmusstück.',
    ac:null, fact:null, spot:null },

  { id:'bruennchen', nr:39, name:'Brünnchen', alias:null, sec:'s4', alt:560,
    dir:'R', gear:'2-3', spd:'~90 km/h', bp:100, risk:3,
    desc:'Zwei enge Rechtskurven bergab mit Kompression dazwischen. Der berühmteste Zuschauerplatz der Nordschleife.',
    tip:'Die zweite Rechte ist die wichtige. Die erste nicht überfahren, sonst kommst du für die zweite nie sauber rein.',
    ac:'Bei Regen eine der rutschigsten Stellen der Strecke.',
    fact:'Wenn ein Nordschleifen-Dreher viral geht, war es meistens hier.',
    spot:'DER Klassiker. Zuschauerhügel direkt an der Strecke, Bratwurst, Camping, Stimmung. Bei 24h früh da sein, sonst kein Platz.' },

  { id:'eiskurve', nr:40, name:'Eiskurve', alias:null, sec:'s4', alt:545,
    dir:'L', gear:'4', spd:'~140 km/h', bp:null, risk:3,
    desc:'Linkskurve nach Brünnchen. Der Name kommt nicht von ungefähr — schattig und oft feucht.',
    tip:'Bei kühlen NLS-Läufen im Frühjahr ist hier oft weniger Grip als überall sonst. Vorsicht in der ersten Runde.',
    ac:null,
    fact:'Der schattige Waldabschnitt trocknet nach Regen deutlich langsamer als der Rest der Strecke.',
    spot:'Vom Brünnchen-Bereich mit einsehbar.' },

  { id:'pflanzgarten1', nr:41, name:'Pflanzgarten I', alias:null, sec:'s4', alt:535,
    dir:'R', gear:'4-5', spd:'~170 km/h', bp:60, risk:5,
    desc:'Schnelle Rechtskurve mit Sprunghügel. Das Auto hebt ab und muss beim Aufsetzen sofort wieder in die Kurve.',
    tip:'Vor dem Sprung positionieren, in der Luft nichts machen. Die Landung entscheidet, ob du Pflanzgarten II überhaupt erreichst.',
    ac:'Eine der besten Stellen, um deinen Mod zu bewerten: gute Nordschleifen-Mods bilden die Kompression hier realistisch ab.',
    fact:'Der Pflanzgarten hieß so, weil hier früher eine Baumschule lag.',
    spot:'Sehr guter Zuschauerplatz — Sprünge aus nächster Nähe.' },

  { id:'pflanzgarten2', nr:42, name:'Sprunghügel', alias:'Pflanzgarten II', sec:'s4', alt:525,
    dir:'R', gear:'4', spd:'~150 km/h', bp:50, risk:5,
    desc:'Der zweite, noch heftigere Sprung. Hier fliegen die Autos in Rennen sichtbar — mit allen vier Rädern.',
    tip:'Absolut gerade über die Kuppe. Wer schräg springt, landet schräg — und dann geht es meistens nicht gut aus.',
    ac:'Wenn dein Auto hier chronisch aufsetzt, ist die Fahrhöhe zu niedrig für die Nordschleife.',
    fact:'Die berühmtesten Flugbilder der Nordschleife entstehen hier.',
    spot:'Absoluter TOP-Spot für Fotos. Bei NLS und 24h einer der besten Plätze überhaupt.' },

  { id:'bellof_s', nr:43, name:'Stefan-Bellof-S', alias:null, sec:'s4', alt:510,
    dir:'S', gear:'3-4', spd:'~130 km/h', bp:80, risk:4,
    desc:'Schnelle S-Kombination nach den Sprüngen.',
    tip:'Der Ausgang der Sprünge geht direkt hier rein — wer am Sprunghügel Zeit verliert, kommt hier nie sauber durch.',
    ac:null,
    fact:'Benannt nach Stefan Bellof, der 1983 im Porsche 956 eine legendäre Nordschleifen-Runde von 6:11,13 min fuhr — jahrzehntelang unerreicht.',
    spot:'Vom Pflanzgarten-Bereich einsehbar.' },

  { id:'schwalbenschwanz', nr:44, name:'Schwalbenschwanz', alias:null, sec:'s4', alt:500,
    dir:'S', gear:'2-3', spd:'~90 km/h', bp:100, risk:3,
    desc:'Enge Kurvenfolge bergab, mündet ins Kleine Karussell.',
    tip:'Eng und ruppig. Nicht auf Zeit fahren, sondern auf Position für das Kleine Karussell.',
    ac:null, fact:null, spot:'Zuschauerbereich vorhanden.' },

  { id:'kl_karussell', nr:45, name:'Kleines Karussell', alias:'Mini-Karussell', sec:'s4', alt:505,
    dir:'R', gear:'2-3', spd:'~80 km/h', bp:60, risk:3,
    desc:'Die kleine Schwester des großen Karussells — ebenfalls eine Betonschüssel, aber schneller und flacher.',
    tip:'Auch hier: reinfallen lassen. Viele fahren zu vorsichtig oben herum und verlieren dabei Zeit.',
    ac:'Deutlich schneller als das große Karussell — meist ein Gang höher.',
    fact:'Wird oft unterschätzt, weil alle nur vom großen Karussell reden.',
    spot:'Guter Zuschauerplatz mit Blick auf die Schüssel.' },

  { id:'galgenkopf', nr:46, name:'Galgenkopf', alias:null, sec:'s4', alt:515,
    dir:'R', gear:'4-5', spd:'~180 km/h', bp:null, risk:4,
    desc:'Die letzte richtige Kurve vor der Döttinger Höhe. Schneller Rechtsbogen, dessen Ausgang die Geschwindigkeit für über zwei Kilometer Vollgas bestimmt.',
    tip:'Die wichtigste Kurve der ganzen Runde für die Rundenzeit. Jedes km/h am Ausgang nimmst du bis Antoniusbuche mit.',
    ac:'Wenn du an einer Stelle Zeit ins Üben investieren willst: hier. Der Effekt auf die Rundenzeit ist gewaltig.',
    fact:'Der Name geht auf eine historische Richtstätte in der Nähe zurück.',
    spot:'Zuschauerbereich vorhanden.' },

  /* ===== S5 — DÖTTINGER HÖHE ===== */
  { id:'doettinger', nr:47, name:'Döttinger Höhe', alias:'die lange Gerade', sec:'s5', alt:555,
    dir:'G', gear:'6', spd:'Topspeed', bp:null, risk:2,
    desc:'Über zwei Kilometer Vollgas. Hier erreichen die Autos ihre Höchstgeschwindigkeit — GT3-Fahrzeuge über 280 km/h.',
    tip:'Windschatten nutzen, Systeme checken, Boxenfunk. Und: langsameren Verkehr rechtzeitig einschätzen — die Geschwindigkeitsunterschiede sind hier am größten.',
    ac:'Perfekt zum Prüfen der Endübersetzung. Du willst kurz vor Antoniusbuche im Begrenzer sein, nicht schon in der Mitte.',
    fact:'Die größten Geschwindigkeitsunterschiede der NLS entstehen hier: ein GT3 mit über 280 km/h trifft auf ein Einsteigerauto mit vielleicht 170.',
    spot:'Zuschauerplatz für Highspeed-Fans. Hier hörst du, warum die Grüne Hölle so heißt.' },

  { id:'antoniusbuche', nr:48, name:'Antoniusbuche', alias:null, sec:'s5', alt:585,
    dir:'L', gear:'6', spd:'~250 km/h', bp:null, risk:3,
    desc:'Leichter Linksknick am Ende der Döttinger Höhe, unter der Brücke hindurch. Bei Topspeed alles andere als harmlos.',
    tip:'Vollgas, aber Lenkrad ruhig. Bei Nässe eine der unterschätztesten Stellen der Strecke.',
    ac:null,
    fact:'Der Name kommt von einer alten Buche mit einem Heiligenbild des heiligen Antonius.',
    spot:'Brücke und Umgebung als Zuschauerbereich beliebt.' },

  { id:'tiergarten', nr:49, name:'Tiergarten', alias:null, sec:'s5', alt:600,
    dir:'R', gear:'5-6', spd:'~220 km/h', bp:null, risk:2,
    desc:'Schneller Rechtsbogen vor der Hohenrain-Schikane.',
    tip:'Bei Touristenfahrten endet hier praktisch deine Runde — bei NLS geht es weiter zur Schikane.',
    ac:'Auf dem Tourist-Layout ist das kurz vor dem Ziel, auf dem 24h-Layout geht es weiter.',
    fact:'Der Name stammt vom früheren Wildgehege in der Nähe.',
    spot:null },

  { id:'hohenrain', nr:50, name:'Hohenrain-Schikane', alias:'Hohenrain', sec:'s5', alt:600,
    dir:'S', gear:'2-3', spd:'~80 km/h', bp:150, risk:3,
    desc:'Die letzte Schikane der Nordschleife, danach geht es zurück auf die GP-Strecke. Enge Links-Rechts-Kombination nach Highspeed-Anfahrt.',
    tip:'Harte Bremsung nach langem Vollgas. Die Kerbs sind hoch — wer zu gierig ist, verliert den Unterboden oder die Runde.',
    ac:'Wurde als Sicherheitsschikane gebaut, um die Geschwindigkeit vor der Boxeneinfahrt zu senken.',
    fact:'Bei Touristenfahrten wird die Hohenrain-Schikane nicht befahren.',
    spot:'Sehr gut einsehbar, beliebter Platz für die letzten Bremsduelle.' }
];

/* ---------- Zuschauer-Spots ---------- */
ND.spots = [
  { name:'Brünnchen', rating:5, sec:'s4', tags:['Stimmung','Dreher','Camping'],
    view:'Zwei enge Rechtskurven bergab, du stehst quasi im Kurvenausgang.',
    tip:'Der Klassiker schlechthin. Bei den 24h früh anreisen — der Hügel ist meist Stunden vor dem Start voll. Grill, Fahnen, Publikum aus halb Europa.',
    warn:'Bei Regen wird der Hang zur Rutschbahn. Feste Schuhe.' },
  { name:'Pflanzgarten', rating:5, sec:'s4', tags:['Sprünge','Fotos','Highspeed'],
    view:'Autos springen mit allen vier Rädern über die Kuppen.',
    tip:'Bester Ort für Fotos mit fliegenden Autos. Teleobjektiv lohnt. Nachts bei den 24h besonders spektakulär.',
    warn:'Weite Fußwege vom Parkplatz. Zeit einplanen.' },
  { name:'Adenauer Forst', rating:5, sec:'s2', tags:['Fehler','Kies','nah dran'],
    view:'Harte Bremsung in eine enge Links-Rechts. Kiesbetten links und rechts.',
    tip:'Die höchste Fehlerdichte der Strecke pro Meter. Wenn jemand irgendwo hängen bleibt, dann hier.',
    warn:'Sehr beliebt, entsprechend früh voll.' },
  { name:'Caracciola-Karussell', rating:5, sec:'s3', tags:['Ikone','Sound','Pflichtbesuch'],
    view:'Die Betonschüssel aus nächster Nähe — Autos kippen direkt vor dir hinein.',
    tip:'Der ikonischste Blickwinkel des Motorsports. Der Sound in der Schüssel ist unbeschreiblich. Einmal im Leben Pflicht.',
    warn:'Anmarsch dauert. Verpflegung mitnehmen.' },
  { name:'Schwedenkreuz', rating:4, sec:'s1', tags:['Highspeed','Respekt'],
    view:'Autos mit rund 250 km/h durch einen Linksbogen bergab.',
    tip:'Hier begreifst du erst, wie schnell die Dinger wirklich sind. Kein Überholen, dafür pure Geschwindigkeitswahrnehmung.',
    warn:'Wenig spektakuläre Action, dafür maximaler Speed-Eindruck.' },
  { name:'Breidscheid / Ex-Mühle', rating:4, sec:'s2', tags:['tiefster Punkt','Dorf','Brücke'],
    view:'Die Brücke über den Adenauer Bach, langsame Kombination.',
    tip:'Charmante Kulisse mitten im Ort. Gute Kombination aus Zuschauen und Infrastruktur — Adenau ist zu Fuß erreichbar.',
    warn:null },
  { name:'Wehrseifen', rating:4, sec:'s2', tags:['langsam','nah dran'],
    view:'Die langsamste Kurve der Nordschleife, extrem nah an der Strecke.',
    tip:'Perfekt, um Fahrstile zu vergleichen. Du siehst hier tatsächlich Lenkkorrekturen und Gesichter.',
    warn:null },
  { name:'Döttinger Höhe', rating:3, sec:'s5', tags:['Topspeed','Sound'],
    view:'Über 280 km/h Vollgas, riesige Geschwindigkeitsunterschiede zwischen den Klassen.',
    tip:'Der beste Platz, um zu verstehen, wie brutal die Leistungsunterschiede im NLS-Feld sind.',
    warn:'Kaum Kurvenaction — als Hauptplatz für einen ganzen Tag zu eintönig.' },
  { name:'GP-Strecke / Tribünen', rating:4, sec:'gp', tags:['Boxenstopps','Komfort','Großbild'],
    view:'Start/Ziel, Boxengasse, Mercedes-Arena-Bereich und Schlussschikane.',
    tip:'Der komfortabelste Platz: Toiletten, Essen, Videowall, Zeitmonitor. Für die 24h-Nacht und den Zieleinlauf ideal.',
    warn:'Du siehst nur einen kleinen Teil der Strecke — dafür alles über Strategie und Boxenstopps.' },
  { name:'Hohe Acht', rating:3, sec:'s3', tags:['höchster Punkt','Aussicht'],
    view:'Der höchste Punkt der Strecke, 617 m.',
    tip:'Schöner Weitblick über die Eifel. Gut mit dem Karussell auf einem Fußweg kombinierbar.',
    warn:'Das Wetter schlägt hier zuerst um — Regenjacke immer dabei.' }
];

/* ---------- NLS / 24h Wissen ---------- */
ND.classes = [
  { code:'SP9 GT3', desc:'Die Königsklasse: GT3-Fahrzeuge nach FIA-Reglement (Porsche 911 GT3 R, BMW M4 GT3, Audi R8 LMS, Mercedes-AMG GT3, Ferrari, Aston, Lamborghini). Kämpfen um den Gesamtsieg.', speed:'Rundenzeit grob 8:00–8:30 min (NLS-Layout)' },
  { code:'SP-X', desc:'Freie Klasse für Fahrzeuge, die in kein anderes Reglement passen. Oft exotisch und sehr schnell.', speed:'variabel, teils GT3-Niveau' },
  { code:'SP-Pro / SP8, SP7', desc:'Seriennahe bis stark modifizierte GT-Fahrzeuge unterhalb der GT3-Klasse.', speed:'ca. 8:40–9:20 min' },
  { code:'Cup 2', desc:'Porsche 911 GT3 Cup — Markenpokal-Fahrzeuge, sehr gleichmäßiges Feld, oft spannende Klassenkämpfe.', speed:'ca. 8:40–9:00 min' },
  { code:'Cup 3', desc:'Porsche Cayman GT4 Clubsport — beliebte Einsteiger-GT-Klasse.', speed:'ca. 9:20–9:50 min' },
  { code:'Cup 5', desc:'BMW M240i Racing Cup — der Klassiker für Nachwuchs und Amateure. Riesige Startfelder.', speed:'ca. 9:50–10:20 min' },
  { code:'TCR', desc:'Fronttriebler-Tourenwagen nach internationalem TCR-Reglement. Enge Rennen, viel Kontakt.', speed:'ca. 9:20–9:45 min' },
  { code:'VT / V-Klassen', desc:'Seriennahe Tourenwagen, nach Hubraum gestaffelt. Das Rückgrat des Feldes.', speed:'ca. 9:40–11:00 min' },
  { code:'AT (Alternative Kraftstoffe)', desc:'Klasse für Fahrzeuge mit alternativen Antrieben und Kraftstoffen — der Ring als Technologielabor.', speed:'variabel' }
];

ND.flags = [
  { flag:'gelb', name:'Gelbe Flagge', color:'#facc15',
    rule:'Gefahr voraus. Geschwindigkeit reduzieren, jederzeit bremsbereit, Überholverbot bis zur grünen Flagge.',
    quiz:'Was gilt bei Gelb?', answer:'Langsamer, bremsbereit, KEIN Überholen.' },
  { flag:'doppelgelb', name:'Doppelt Gelb', color:'#fde047',
    rule:'Große Gefahr, Strecke ganz oder teilweise blockiert. Stark verlangsamen, jederzeit anhaltebereit, Überholverbot.',
    quiz:'Doppelt Gelb bedeutet?', answer:'Stark verlangsamen, anhaltebereit sein, kein Überholen.' },
  { flag:'code60', name:'Code 60', color:'#f97316',
    rule:'Nordschleifen-Spezialität: Ab dem Code-60-Schild gilt Tempo 60 km/h auf dem betroffenen Abschnitt. Überholverbot, Abstand halten, Position beibehalten. Wird bei Bergungen eingesetzt, statt die ganze Strecke zu neutralisieren.',
    quiz:'Wie schnell darfst du bei Code 60 fahren?', answer:'Maximal 60 km/h — und niemand darf überholt werden.' },
  { flag:'blau', name:'Blaue Flagge', color:'#3b82f6',
    rule:'Ein schnelleres Fahrzeug will überholen. Auf der Nordschleife lebenswichtig, weil die Klassen 100 km/h Geschwindigkeitsunterschied haben können.',
    quiz:'Blaue Flagge — was tun?', answer:'Schnellere Fahrzeuge sicher und berechenbar vorbeilassen.' },
  { flag:'rot', name:'Rote Flagge', color:'#ef4444',
    rule:'Rennabbruch. Alle Fahrzeuge verlangsamen und fahren zur Box beziehungsweise an einen angewiesenen Punkt. Überholverbot.',
    quiz:'Rote Flagge?', answer:'Rennen unterbrochen — langsam zur Box, kein Überholen.' },
  { flag:'weiss', name:'Weiße Flagge', color:'#e5e7eb',
    rule:'Langsames Fahrzeug auf der Strecke — etwa ein Bergungsfahrzeug oder ein havariertes Auto.',
    quiz:'Weiße Flagge bedeutet?', answer:'Langsames Fahrzeug voraus.' },
  { flag:'gruen', name:'Grüne Flagge', color:'#22c55e',
    rule:'Gefahrenstelle beendet, Strecke wieder frei.',
    quiz:'Grüne Flagge?', answer:'Strecke frei, Gefahr vorbei.' },
  { flag:'schwarzweiss', name:'Schwarz-weiße Flagge', color:'#a3a3a3',
    rule:'Verwarnung wegen unsportlichen Verhaltens. Die letzte Warnung vor der schwarzen Flagge.',
    quiz:'Schwarz-weiße Flagge?', answer:'Verwarnung wegen unsportlichen Verhaltens.' },
  { flag:'oel', name:'Gelb-rot gestreift', color:'#fb923c',
    rule:'Rutschgefahr durch Öl, Wasser oder Kies auf der Strecke.',
    quiz:'Gelb-rot gestreift?', answer:'Rutschgefahr — Öl, Wasser oder Kies auf der Bahn.' }
];

ND.facts = [
  'Die Nordschleife ist 20,832 km lang. Das NLS/24h-Layout mit GP-Strecke misst 24,358 km.',
  'Der Höhenunterschied zwischen Breidscheid (rund 320 m) und Hohe Acht (617 m) beträgt fast 300 Meter.',
  'Jackie Stewart nannte die Nordschleife die "Grüne Hölle" — der Name blieb hängen.',
  'Stefan Bellof fuhr 1983 im Porsche 956 eine 6:11,13 min. Diese Zeit galt jahrzehntelang als unantastbar.',
  'Timo Bernhard unterbot 2018 im Porsche 919 Hybrid Evo die 6-Minuten-Marke deutlich: 5:19,546 min.',
  'Niki Laudas schwerer Unfall 1976 ereignete sich am Bergwerk — danach war die Formel-1-Ära auf der Nordschleife beendet.',
  'Die Strecke wurde in den 1920er-Jahren als Arbeitsbeschaffungsmaßnahme gebaut und am 18. Juni 1927 eröffnet.',
  'Sabine Schmitz wurde als "Königin der Nordschleife" bekannt und gewann das 24-Stunden-Rennen zweimal. Heute trägt eine Kurve gleich nach dem Start ihren Namen.',
  'Das Karussell entstand angeblich, weil Fahrer merkten, dass die Fahrt durch den Entwässerungsgraben schneller ist als außen herum.',
  'Bei den 24h stehen regelmäßig über 100 Fahrzeuge am Start — von GT3-Boliden bis zu seriennahen Tourenwagen.',
  'Der Geschwindigkeitsunterschied zwischen der schnellsten und langsamsten Klasse kann über 100 km/h betragen.',
  'Code 60 wurde eingeführt, um bei Unfällen nicht die komplette Strecke neutralisieren zu müssen — auf 20 km Länge wäre das kaum praktikabel.',
  'Die Nordschleife hat rund 73 Kurven — die genaue Zählweise ist unter Fans ein beliebter Streitpunkt.',
  'Bei Touristenfahrten endet die Runde vor der Hohenrain-Schikane — sie ist dort nicht Teil der Strecke.',
  'Die Fuchsröhre gilt unter Fahrern als eindrucksvollste Passage: bergab, blind, Vollgas, mit heftiger Kompression im Tal.',
  'Das Wetter kann sich auf 20 km Streckenlänge komplett unterscheiden — Sonne am Start, Regen am Karussell ist Alltag.',
  'Das 24-Stunden-Rennen wurde erstmals 1970 ausgetragen.',
  'Bei der NLS starten die Fahrzeuge in mehreren Gruppen, um das riesige Feld zu entzerren.'
];

/* ---------- Assetto Corsa Ecke ---------- */
ND.acContent = {
  drills: [
    { title:'Der 3-Sektoren-Plan', time:'45 min',
      body:'Fahre nicht ständig ganze Runden. Teile die Strecke in drei Blöcke: (1) Start bis Adenauer Forst, (2) Adenauer Forst bis Hohe Acht, (3) Hohe Acht bis Ziel. Übe jeden Block 15 Minuten am Stück. Du lernst dreimal so schnell wie mit ganzen Runden.' },
    { title:'Bremspunkt-Kalibrierung', time:'20 min',
      body:'Such dir acht Bremspunkte aus dem Lexikon (Aremberg, Adenauer Forst, Wehrseifen, Bergwerk, Klostertal, Brünnchen, Hohenrain, Yokohama). Fahre jede Kurve fünfmal und brems bewusst einmal zu früh, einmal zu spät. Du willst das Fenster kennen, nicht nur den Punkt.' },
    { title:'Blind-Runde',  time:'15 min',
      body:'Fahre eine Runde und sage laut den Namen der nächsten Kurve, BEVOR du sie siehst. Wenn du das schaffst, kennst du die Strecke wirklich. Genau dafür ist das Minispiel "Blind Lap" da.' },
    { title:'Verkehrs-Training', time:'30 min',
      body:'Setze KI-Gegner mit stark unterschiedlicher Stärke ins Rennen, etwa 70 % und 100 %. Übe das Überholen an den richtigen Stellen: Döttinger Höhe, Kesselchen, Anfahrt Aremberg. Genau so fühlt sich NLS-Verkehr an.' },
    { title:'Regen-Runde', time:'20 min',
      body:'Fahre bewusst bei Nässe. Lerne, welche Stellen zuerst nass bleiben: Eiskurve, Wehrseifen, Brünnchen, alles im Wald. Das macht dich auch als Zuschauer schlauer.' },
    { title:'Konstanz-Test', time:'30 min',
      body:'Fahre fünf Runden am Stück und notiere die Zeiten. Ziel ist nicht die schnellste Runde, sondern eine Streuung unter 3 Sekunden. Genau darauf kommt es bei 24h an.' }
  ],
  setup: [
    { title:'Fahrhöhe', body:'Höher als auf jeder anderen Strecke. Pflanzgarten, Fuchsröhre und das Karussell bestrafen zu tiefe Autos sofort mit Aufsetzern und Kontrollverlust.' },
    { title:'Federn & Dämpfer', body:'Weicher als auf glattem Asphalt. Die Nordschleife ist wellig — das Auto muss der Strecke folgen können, nicht darüber springen.' },
    { title:'Übersetzung', body:'Auf die Döttinger Höhe auslegen: der Begrenzer soll kurz vor Antoniusbuche kommen, nicht schon in der Mitte der Geraden.' },
    { title:'Bremsbalance', body:'Etwas weiter vorn als üblich. Viele Bremsungen finden bergab statt (Wehrseifen, Kallenhard, Wippermann) — dort ist das Heck ohnehin leicht.' },
    { title:'Aero', body:'Kompromiss statt Extrem. Du brauchst Anpressdruck für Schwedenkreuz und Flugplatz, aber Topspeed für über zwei Kilometer Vollgas.' },
    { title:'Tankfüllung', body:'Übe mit Renntank, nicht mit 20 Litern. Ein volles Auto fährt an der Fuchsröhre und im Karussell völlig anders.' }
  ],
  refTimes: [
    { car:'GT3 (NLS-Layout, 24,358 km)', time:'8:00 – 8:30 min' },
    { car:'GT3 (reine Nordschleife, 20,832 km)', time:'ca. 6:50 – 7:20 min' },
    { car:'Porsche 911 GT3 Cup', time:'ca. 8:40 – 9:00 min (NLS-Layout)' },
    { car:'Cayman GT4 Clubsport', time:'ca. 9:20 – 9:50 min (NLS-Layout)' },
    { car:'Seriennaher Tourenwagen', time:'ca. 9:45 – 11:00 min (NLS-Layout)' },
    { car:'Ambitionierter Sim-Einsteiger (GT3, Nordschleife)', time:'8:30 min ist ein solider Start — 7:30 min ist richtig gut' }
  ],
  tips: [
    'Nimm Fahrhilfen schrittweise raus: erst ABS runter, dann TC, dann Automatikgetriebe. Nicht alles auf einmal.',
    'Fahre die ersten Stunden bewusst fünf Sekunden langsamer als möglich. Du lernst die Linie, nicht das Limit.',
    'Nutze eine App für Delta-Zeiten pro Sektor statt nur die Gesamtrundenzeit — sonst weißt du nie, wo du verlierst.',
    'Schau Onboards von echten NLS-Fahrern und achte auf die Blickführung, nicht auf die Rundenzeiten.',
    'Wenn du dich verfährst oder abfliegst: Runde zu Ende fahren. Auf der echten Nordschleife kannst du auch nicht resetten.',
    'Triple-Screen oder VR helfen auf der Nordschleife mehr als auf jeder anderen Strecke — periphere Sicht ist hier Gold wert.'
  ]
};

/* ---------- Achievements ---------- */
ND.achievements = [
  { id:'first_lap',   icon:'🏁', name:'Erste Runde',        desc:'Beantworte deine erste Frage richtig.' },
  { id:'xp_500',      icon:'⚡', name:'Warmgefahren',       desc:'Erreiche 500 XP.' },
  { id:'xp_2000',     icon:'🔥', name:'Auf Betriebstemperatur', desc:'Erreiche 2000 XP.' },
  { id:'xp_5000',     icon:'👑', name:'Ring-Veteran',       desc:'Erreiche 5000 XP.' },
  { id:'streak_10',   icon:'🎯', name:'Zehn am Stück',      desc:'10 richtige Antworten in Folge.' },
  { id:'streak_25',   icon:'💎', name:'Fehlerfrei',         desc:'25 richtige Antworten in Folge.' },
  { id:'full_lap',    icon:'🗺️', name:'Blind Lap',          desc:'Schaffe im Blind-Lap-Spiel eine komplette Runde.' },
  { id:'perfect_brake', icon:'🛑', name:'Bremspunkt-König', desc:'10 perfekte Bremspunkte in einer Session.' },
  { id:'flag_master', icon:'🚩', name:'Streckenposten',     desc:'Alle Flaggen-Fragen einer Runde richtig.' },
  { id:'map_sniper',  icon:'📍', name:'Kartenleser',        desc:'15 Treffer im Karten-Klick-Spiel.' },
  { id:'lexikon',     icon:'📖', name:'Streckenkunde',      desc:'Öffne 30 verschiedene Kurven im Lexikon.' },
  { id:'mastery_10',  icon:'🥉', name:'10 Kurven sitzen',   desc:'10 Kurven auf Meisterschaft 80 %+.' },
  { id:'mastery_25',  icon:'🥈', name:'25 Kurven sitzen',   desc:'25 Kurven auf Meisterschaft 80 %+.' },
  { id:'mastery_all', icon:'🥇', name:'Grüne Hölle bezwungen', desc:'Alle Kurven auf Meisterschaft 80 %+.' },
  { id:'speedrun',    icon:'⏱️', name:'Speedrunner',        desc:'Beende den Blitz-Modus mit 25+ Punkten.' },
  { id:'nightowl',    icon:'🌙', name:'Nachtschicht',       desc:'Spiele zwischen 0 und 5 Uhr — 24h-Feeling.' }
];

/* ---------- Kurven, deren Name in der Übersichtskarte immer sichtbar ist ----------
   Der Rest wird eingeblendet, sobald ein Abschnitt gefiltert wird — sonst
   überlagern sich auf 50 Punkten die Beschriftungen. */
ND.keyLabels = new Set([
  'gp_sf', 'ns_start', 'hatzenbach', 'flugplatz', 'schwedenkreuz', 'aremberg',
  'fuchsroehre', 'adenauer_forst', 'kallenhard', 'wehrseifen', 'breidscheid',
  'bergwerk', 'kesselchen', 'klostertal', 'karussell', 'hohe_acht',
  'bruennchen', 'pflanzgarten2', 'schwalbenschwanz', 'galgenkopf',
  'doettinger', 'antoniusbuche', 'hohenrain'
]);

/* ---------- Echte Geometrie aus js/geo.js übernehmen ---------- */
ND.applyGeo = function () {
  if (!ND.geo) { console.error('geo.js fehlt — die Karte kann nicht gezeichnet werden.'); return; }
  ND.corners.forEach(c => {
    const p = ND.geo.pos[c.id] || ND.geo.gpPos[c.id];
    if (!p) { console.warn('Keine Position für Kurve', c.id); return; }
    c.x = p.x;
    c.y = p.y;
    if (p.km != null) c.km = p.km;      // echte Kilometrierung der Nordschleife
    if (p.frac != null) c.frac = p.frac;
  });
  // GP-Kurven bekommen die km-Marke der Gesamtstrecke nur als Näherung
  ND.corners.filter(c => c.sec === 'gp' && c.km == null).forEach((c, i, arr) => {
    c.km = null;
  });
};

/* Hilfsindizes */
ND.byId = {};
ND.corners.forEach(c => { ND.byId[c.id] = c; });
ND.nordschleife = ND.corners.filter(c => c.sec !== 'gp');
ND.quizPool = ND.corners.filter(c => c.quiz !== false);
ND.sectorById = {};
ND.sectors.forEach(s => { ND.sectorById[s.id] = s; });
