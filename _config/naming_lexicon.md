---
type: OnomasticLexicon
name: Soundingboard Tactical Onomastic Lexicon
version: 2.0
schema: 2.0
last_modified: 2026-09-17
description: "Curated historical, speculative, toponymic, and dialectical name components, prefixes, suffixes, and morphemes with anti-AI slop filters."
---

# Soundingboard Tactical Onomastic Lexicon

This reference database powers the Soundingboard name generator and provides human authors and AI creative partners with linguistically grounded, anti-slop naming material for characters, places, factions, and worlds.

---

```yaml
anti_ai_denylist:
  first_names:
    - Lyra
    - Elara
    - Kaelen
    - Kaelyn
    - Silas
    - Rowan
    - Aiden
    - Aidan
    - Caelum
    - Seraphina
    - Malakai
    - Malachi
    - Zephyr
    - Zephyra
    - Xander
    - Aria
    - Theron
    - Corin
    - Vane
    - Jax
    - Nyx
    - Jaxon
    - Soren
  last_names:
    - Shadowblade
    - Bloodthorne
    - Nightwhisper
    - Darkstar
    - Stormborn
    - Ravenscroft
    - Blackwood
    - Thorne
    - Cross
    - Vance
    - Frost
    - Sterling
    - Silverleaf
    - Ashdown
    - Winterfell
    - Ironheart
  place_cliches:
    - Whispering Woods
    - Shadowfen
    - Dragon's Peak
    - Blood River
    - Silvermoon
    - Stormhaven
    - Mistwood
    - Sunspire

cultures:
  norse_scandinavian:
    phonotactics: "Rugged plosives, dental fricatives (th/dh), long open vowels (a, o, u), consonant clusters (sk, br, gr, tr)."
    first_names:
      masculine:
        - Halvar
        - Torstein
        - Sigurd
        - Einar
        - Kjell
        - Ivar
        - Viggo
        - Asger
        - Arnvid
        - Bror
        - Dag
        - Fritjof
        - Geir
        - Hakon
        - Jostein
        - Kolbeinn
        - Roar
        - Stian
        - Trygve
        - Vidar
      feminine:
        - Sigrid
        - Astrid
        - Freja
        - Gunhild
        - Ragnhild
        - Solveig
        - Torny
        - Ylva
        - Gerd
        - Bergljot
        - Disa
        - Embla
        - Gro
        - Halla
        - Inga
        - Kari
        - Liv
        - Rannveig
        - Sunniva
        - Thora
      neutral_or_archaic:
        - Bo
        - Inge
        - Kare
        - Rune
        - Skarde
    last_names:
      - Lindqvist
      - Skovgaard
      - Halvorsen
      - Nystrom
      - Bergfalk
      - Dahlgren
      - Eklund
      - Granberg
      - Holgersson
      - Jarnkrok
      - Kjellberg
      - Lundmark
      - Malmkvist
      - Nordh
      - Sandstrom
      - Tjader
      - Vang
      - Westermark
      - Aaberg
      - Ostberg
    prefixes:
      - "Gamle-" # Old
      - "Raud-"  # Red
      - "Graa-"  # Gray
      - "Jarl-"  # Noble title
    suffixes:
      - "-son"
      - "-sen"
      - "-dottir"
      - "-holm"
      - "-gard"
      - "-vik"
    toponyms:
      roots: ["fjord", "vik", "foss", "nes", "berg", "dal", "sund", "holm", "vaag"]
      samples: ["Kvalsund", "Fosshaug", "Neshovda", "Breidablikk", "Skagafjord", "Trollvasstind"]

  anglo_saxon_medieval_english:
    phonotactics: "Earthy Germanic monosyllables and trochees, compound vocational and agrarian stems, blunt codas (d, t, k, p, ch)."
    first_names:
      masculine:
        - Wulfric
        - Alden
        - Godric
        - Dunstan
        - Ealdred
        - Cynric
        - Beorn
        - Leofric
        - Osric
        - Cenwulf
        - Tatwine
        - Wulfstan
        - Colman
        - Brand
        - Wystan
        - Raedwald
        - Ordgar
        - Swithun
        - Hereward
        - Athelstan
      feminine:
        - Eadgyth
        - Mildthryth
        - Cynewise
        - Wulfrun
        - Godiva
        - Hilda
        - Aelswith
        - Eormenhild
        - Saegyth
        - Frideswide
        - Aethelflad
        - Cynethryth
        - Dunhild
        - Leofgifu
        - Morwen
      neutral_or_archaic:
        - Dale
        - Glen
        - Wynn
        - Garn
        - Leigh
    last_names:
      - Blackwood
      - Fletcher
      - Wainman
      - Cartwright
      - Bowyer
      - Thatcher
      - Hayward
      - Colfox
      - Penderel
      - Cloutier
      - Fallowfield
      - Redmayne
      - Claypole
      - Hallowell
      - Crowther
      - Oakhill
      - Sallow
      - Broadbent
      - Nethercote
      - Wetherby
    prefixes:
      - "Old "
      - "Master "
      - "Goodman "
      - "Dame "
    suffixes:
      - "-ton"
      - "-ham"
      - "-wick"
      - "-stead"
      - "-by"
      - "-croft"
    toponyms:
      roots: ["ford", "stead", "ham", "wick", "bury", "ton", "hurst", "mere", "shaw", "tarn"]
      samples: ["Elmswell", "Crowshaw", "Fallowford", "Netherbury", "Blackmere", "Clayhurst"]

  celtic_gaelic_welsh:
    phonotactics: "Soft fricatives (ch, th, dd), vowel glides, lenition (b->v, m->v, c->ch), lilting trisyllables."
    first_names:
      masculine:
        - Cormac
        - Callum
        - Ronan
        - Tadhg
        - Cian
        - Oisin
        - Diarmuid
        - Aneurin
        - Caradoc
        - Gwilym
        - Rhys
        - Idwal
        - Maelgwn
        - Dafydd
        - Bedwyr
        - Fintan
        - Padraig
        - Senan
        - Lorcan
        - Eoghan
      feminine:
        - Maeve
        - Rhiannon
        - Sorcha
        - Caoimhe
        - Niamh
        - Bronwen
        - Angharad
        - Eira
        - Gwyneth
        - Ceridwen
        - Ffion
        - Sibeal
        - Roisin
        - Clodagh
        - Ailbhe
        - Morag
        - Catriona
        - Olwen
        - Blodeuwedd
        - Eluned
      neutral_or_archaic:
        - Carey
        - Morgan
        - Reagan
        - Celyn
        - Eryl
    last_names:
      - MacLeod
      - Gallagher
      - O'Shea
      - Vaughan
      - MacIntyre
      - Bevan
      - Trevethan
      - Penrhyn
      - Colquhoun
      - MacNaughton
      - Llewellyn
      - Pendelton
      - Carew
      - Nancarrow
      - MacCarthy
      - O'Dowd
      - Trelawney
      - MacSweeney
      - Carmody
      - Treloar
    prefixes:
      - "Mac"
      - "Mc"
      - "O'"
      - "Ap "
      - "Fitz"
    suffixes:
      - "-ach"
      - "-an"
      - "-in"
      - "-og"
    toponyms:
      roots: ["caer", "dún", "glen", "bally", "ard", "aber", "pen", "tor", "strath", "loch"]
      samples: ["Caerhays", "Dunmore", "Glenavy", "Ballynahinch", "Aberdyfi", "Pentire", "Torfaen"]

  greco_roman_classical:
    phonotactics: "Stately trochaic and dactylic rhythms, sonorous Latinate and Hellenic terminations (-us, -a, -ius, -ander, -or)."
    first_names:
      masculine:
        - Lysander
        - Cassian
        - Valerius
        - Decimus
        - Tiberius
        - Nikandros
        - Theron
        - Evander
        - Coriolanus
        - Servius
        - Demetrius
        - Aulus
        - Quintus
        - Xenophon
        - Pausanias
        - Cleon
        - Brasidas
        - Marius
        - Lucian
        - Philo
      feminine:
        - Aurelia
        - Drusilla
        - Cassia
        - Philomena
        - Antonia
        - Theodora
        - Junia
        - Valeria
        - Livia
        - Cornelia
        - Damaris
        - Xanthe
        - Berenice
        - Callista
        - Hermione
        - Marcella
        - Flavia
        - Phaedra
        - Zenobia
        - Claudia
      neutral_or_archaic:
        - Alexis
        - Heron
        - Castor
        - Iason
    last_names:
      - Corvinus
      - Metellus
      - Scaevola
      - Varrone
      - Calpurnius
      - Castiglione
      - Argyros
      - Komnenos
      - Laskaris
      - Palaiologos
      - Fabius
      - Dentatus
      - Agricola
      - Severus
      - Balbus
      - Crispus
      - Rufus
      - Strabo
      - Cotta
      - Pulcher
    prefixes:
      - "Archon "
      - "Proconsul "
      - "Legate "
      - "Tribune "
    suffixes:
      - "-ides"
      - "-iades"
      - "-ianus"
      - "-inus"
    toponyms:
      roots: ["polis", "castrum", "mons", "pons", "portus", "via", "forum", "vallis"]
      samples: ["Neapolis", "Castrum Novum", "Mons Sacer", "Pontus Aureus", "Portus Traiani", "Vallecula"]

  slavic_eastern_european:
    phonotactics: "Palatalized consonants, consonant clusters (vzk, str, pr, br), rich diminutive variations, vowel alternation."
    first_names:
      masculine:
        - Boris
        - Milan
        - Zoran
        - Bogdan
        - Dragomir
        - Casimir
        - Radomir
        - Stanislav
        - Vsevolod
        - Yaroslav
        - Branislav
        - Rostislav
        - Milos
        - Darko
        - Goran
        - Stjepan
        - Vladislav
        - Svyatoslav
        - Lazar
        - Boleslav
      feminine:
        - Danica
        - Zoya
        - Milena
        - Radmila
        - Vesna
        - Dragana
        - Miroslava
        - Zoritsa
        - Lyubov
        - Nadezhda
        - Svetlana
        - Yaroslava
        - Bogdana
        - Stanislava
        - Bronislava
        - Bojana
        - Dusanka
        - Gordana
        - Jasna
        - Snezhana
      neutral_or_archaic:
        - Sacha
        - Vanya
        - Misha
        - Zhenya
    last_names:
      - Morozov
      - Volkov
      - Petrov
      - Novak
      - Horvat
      - Kovac
      - Cerny
      - Dvorak
      - Prochazka
      - Nemec
      - Kolar
      - Blazevic
      - Juric
      - Babic
      - Markovic
      - Stankovic
      - Jankovic
      - Vukovic
      - Maric
      - Radic
    prefixes:
      - "Pan "
      - "Boyar "
      - "Voivode "
      - "Knyaz "
    suffixes:
      - "-ov"
      - "-ev"
      - "-ovic"
      - "-evich"
      - "-ski"
      - "-ska"
      - "-in"
    toponyms:
      roots: ["grad", "brod", "polje", "gora", "les", "brijeg", "voda", "reka", "ostrog"]
      samples: ["Belograd", "Crnagora", "Starobrod", "Medvednica", "Vranopolje", "Jasenovac"]

  east_asian_sino_korean_japonic:
    phonotactics: "Syllable-timed, tonal/pitch-accent roots, balanced open syllables (CV or CVC with nasal coda -n/-ng), concise morphemes."
    first_names:
      masculine:
        - Ren
        - Jin
        - Kenji
        - Daiki
        - Bo-kyung
        - Tae-hyun
        - Seung-ho
        - Zhi-yuan
        - Ming-ze
        - Jian-hao
        - Jun-jie
        - Haruto
        - Kento
        - Souta
        - Ryota
        - Do-yoon
        - Min-jae
        - Ha-joon
        - Yi-chen
        - Tian-lang
      feminine:
        - Mei
        - Sora
        - Aoi
        - Yuna
        - Eun-ji
        - Ji-min
        - Seo-yeon
        - Xiao-ying
        - Shu-lan
        - Zi-han
        - Yu-tong
        - Koharu
        - Riko
        - Hinata
        - Chiyo
        - Soo-jin
        - Min-seo
        - Hye-won
        - Ling-xi
        - Wen-jing
      neutral_or_archaic:
        - Yu
        - Chen
        - Lin
        - Hikaru
        - Kaoru
    last_names:
      - Tanaka
      - Watanabe
      - Takahashi
      - Kobayashi
      - Chen
      - Huang
      - Zhang
      - Zhou
      - Kang
      - Yoon
      - Lim
      - Baek
      - Shin
      - Song
      - Xu
      - Liu
      - Wu
      - Zhao
      - Ito
      - Nakamura
    prefixes:
      - "Lao-"   # Elder / familiar
      - "Xiao-"  # Little / junior
      - "O-"     # Polite honorific
    suffixes:
      - "-san"
      - "-sama"
      - "-shi"
      - "-ssi"
    toponyms:
      roots: ["shan", "jiang", "he", "wan", "dao", "yama", "kawa", "mura", "san", "gang"]
      samples: ["Qingshan", "Heishan", "Longwan", "Matsuyama", "Shirakawa", "Cheongsan"]

  middle_eastern_persian_levantine:
    phonotactics: "Triliteral root morphology, uvular and pharyngeal consonants (q, kh, gh, ayn), rich vowel inflections."
    first_names:
      masculine:
        - Tariq
        - Cyrus
        - Roshan
        - Farhan
        - Zayd
        - Qasim
        - Navid
        - Sohrab
        - Bahman
        - Javad
        - Kamran
        - Mansoor
        - Nabil
        - Rafiq
        - Selim
        - Tahir
        - Walid
        - Yousef
        - Zayn
        - Arash
      feminine:
        - Soraya
        - Roxana
        - Parisa
        - Shahrzad
        - Niloufar
        - Layla
        - Fatima
        - Yasmin
        - Dunya
        - Mariam
        - Samira
        - Farida
        - Aziza
        - Shirin
        - Golnar
        - Maryam
        - Noora
        - Salma
        - Zeinab
        - Hengameh
      neutral_or_archaic:
        - Noor
        - Danesh
        - Ehsan
        - Iman
    last_names:
      - Al-Mansoor
      - Haddad
      - Barzani
      - Najjar
      - Tehrani
      - Esfahani
      - Bagheri
      - Khoury
      - Kassam
      - Naderi
      - Rostami
      - Kardan
      - Farahani
      - Moradi
      - Soleimani
      - Tabatabaei
      - Zadeh
      - Darzi
      - Sabbagh
      - Shammas
    prefixes:
      - "Al-"
      - "Ibn "
      - "Abu "
      - "Umm "
      - "Mirza "
    suffixes:
      - "-zadeh"
      - "-ian"
      - "-pour"
      - "-i"
    toponyms:
      roots: ["abad", "shahr", "rud", "kuh", "wadi", "tell", "ain", "qalat", "deir"]
      samples: ["Firuzabad", "Kuh-e Nur", "Wadi Rum", "Tell Brak", "Qalat Siman", "Deir Zor"]

  south_asian_indic:
    phonotactics: "Retroflex consonants (t, d), aspirated plosives (bh, dh, gh), sonorous conjuncts (pr, tr, ksh, nd)."
    first_names:
      masculine:
        - Aarav
        - Rohan
        - Dev
        - Vikram
        - Arjun
        - Bhaskar
        - Chirag
        - Dhruv
        - Girish
        - Hemant
        - Ishan
        - Jayant
        - Kalyan
        - Madhav
        - Naveen
        - Pranav
        - Raghav
        - Somesh
        - Tushar
        - Utkarsh
      feminine:
        - Priya
        - Kavita
        - Ananya
        - Sunita
        - Malini
        - Deepa
        - Gayatri
        - Harini
        - Indira
        - Jyoti
        - Kamala
        - Leela
        - Meera
        - Nandini
        - Pallavi
        - Radha
        - Shanti
        - Tanvi
        - Uma
        - Vasundhara
      neutral_or_archaic:
        - Kiran
        - Suman
        - Amar
        - Snehal
    last_names:
      - Sharma
      - Patel
      - Bannerjee
      - Rao
      - Deshmukh
      - Kulkarni
      - Chatterjee
      - Pillai
      - Nair
      - Iyengar
      - Mukherjee
      - Joshi
      - Bhatt
      - Varma
      - Sen
      - Dasgupta
      - Hegde
      - Menon
      - Shukla
      - Trivedi
    prefixes:
      - "Pandit "
      - "Sri "
      - "Mahant "
      - "Raja "
    suffixes:
      - "-kar"
      - "-wala"
      - "-puri"
      - "-nagar"
    toponyms:
      roots: ["pur", "nagar", "garh", "gaon", "giri", "kund", "khet", "ghat"]
      samples: ["Devgiri", "Chandrapur", "Sundargarh", "Ramgaon", "Brahmakund", "Haridwar"]

  african_west_and_east:
    phonotactics: "Open CV syllables, implosives and labiovelars (gb, kp, mb, nd), tonal pitch contrasts, liquid vitality."
    first_names:
      masculine:
        - Kofi
        - Malik
        - Amari
        - Kaelo
        - Babatunde
        - Chidike
        - Ekwueme
        - Faraji
        - Gathii
        - Jengo
        - Kamau
        - Lumumba
        - Mandla
        - Nnamdi
        - Olatunji
        - Sekou
        - Tendai
        - Wekesa
        - Yaw
        - Zikomo
      feminine:
        - Zuri
        - Amara
        - Nia
        - Folashade
        - Chiamaka
        - Bisi
        - Dalila
        - Efua
        - Gugu
        - Hasana
        - Ifeoma
        - Jendayi
        - Kenia
        - Lerato
        - Makena
        - Nombuso
        - Olufunke
        - Siphokazi
        - Thandiwe
        - Zalika
      neutral_or_archaic:
        - Ayo
        - Damilola
        - Simphiwe
        - Kunto
    last_names:
      - Okafor
      - Adebayo
      - Mensah
      - Kamau
      - Sow
      - Diallo
      - Traore
      - Toure
      - Keita
      - Baloyi
      - Mwangi
      - Osei
      - Achebe
      - Chimimba
      - Dlamini
      - Sibanda
      - Ndebele
      - Omondi
      - Gikandi
      - Asare
    prefixes:
      - "Baba "
      - "Mama "
      - "Elder "
      - "Oba "
    suffixes:
      - "-ola"
      - "-bayo"
      - "-tunde"
      - "-mambo"
    toponyms:
      roots: ["kigali", "zambezi", "kilima", "nyanza", "ibadan", "kitale"]
      samples: ["Kibirizi", "Mweru", "Nyabugogo", "Songwe", "Kilimambogo", "Kalambo"]

  modern_hispanic_and_latin_american:
    phonotactics: "Vowel-final cadence, vibrant trills (rr), dental stops (t, d), palatal nasals (ñ), liquid flow."
    first_names:
      masculine:
        - Mateo
        - Santiago
        - Emiliano
        - Joaquin
        - Diego
        - Javier
        - Rafael
        - Alejandro
        - Andres
        - Tomas
        - Carlos
        - Manuel
        - Salvador
        - Rodrigo
        - Ignacio
        - Gonzalo
        - Esteban
        - Damian
        - Alvaro
        - Hector
      feminine:
        - Valentina
        - Sofia
        - Camila
        - Lucia
        - Isabella
        - Catalina
        - Mariana
        - Jimena
        - Renata
        - Valeria
        - Esperanza
        - Pilar
        - Rocio
        - Marisol
        - Paloma
        - Ines
        - Beatriz
        - Carmen
        - Mercedes
        - Soledad
      neutral_or_archaic:
        - Cruz
        - Guadalupe
        - Reyes
        - Paz
        - Rosario
    last_names:
      - Hernandez
      - Rodriguez
      - Morales
      - Castillo
      - Navarro
      - Delgado
      - Mendoza
      - Guerrero
      - Rios
      - Vargas
      - Fernandez
      - Salazar
      - Alvarez
      - Ortiz
      - Medina
      - Romero
      - Fuentes
      - Carrillo
      - Montoya
      - Beltran
    prefixes:
      - "Don "
      - "Doña "
      - "de "
      - "de la "
      - "del "
    suffixes:
      - "-ez"
      - "-es"
      - "-ito"
      - "-ita"
      - "-on"
    toponyms:
      roots: ["valle", "rio", "monte", "costa", "puerto", "vega", "sierra", "pueblo"]
      samples: ["Valle Verde", "Rio Bravo", "Montenegro", "Puerto Esperanza", "Sierra Madre", "Altamira"]

  modern_lusophone_and_brazilian:
    phonotactics: "Nasalized vowels (ão, õe), soft sibilants, palatalized dentals, melodic cadence."
    first_names:
      masculine:
        - Thiago
        - Rodrigo
        - Lucas
        - Rafael
        - Caio
        - Gustavo
        - Henrique
        - Bernardo
        - Danilo
        - Vinicius
        - Murilo
        - Otavio
        - Eduardo
        - Marcelo
        - Renato
        - Leandro
        - Fabio
        - Alexandre
        - Cristiano
        - Bruno
      feminine:
        - Beatriz
        - Camila
        - Larissa
        - Fernanda
        - Leticia
        - Mariana
        - Gabriela
        - Bruna
        - Juliana
        - Carolina
        - Aline
        - Patricia
        - Renata
        - Vanessa
        - Priscila
        - Bianca
        - Luciana
        - Clarice
        - Elisa
        - Manuela
      neutral_or_archaic:
        - Darcy
        - Juraci
        - Iraci
    last_names:
      - Silva
      - Santos
      - Oliveira
      - Souza
      - Pereira
      - Ferreira
      - Almeida
      - Ribeiro
      - Carvalho
      - Teixeira
      - Moreira
      - Correia
      - Mendes
      - Barros
      - Freitas
      - Barbosa
      - Pinto
      - Castro
      - Cardoso
      - Guimaraes
    prefixes:
      - "Dom "
      - "Dona "
      - "de "
      - "dos "
      - "das "
    suffixes:
      - "-inho"
      - "-inha"
      - "-eira"
      - "-al"
    toponyms:
      roots: ["porto", "serra", "rio", "campo", "vila", "foz", "morro", "praia"]
      samples: ["Porto Real", "Serra Azul", "Foz do Rio", "Vila Nova", "Morro Alto", "Praia Grande"]

  modern_francophone:
    phonotactics: "Nasal vowels (an, on, in), uvular trill (r), final consonant elision, liaison flow, soft sibilants."
    first_names:
      masculine:
        - Etienne
        - Sebastien
        - Antoine
        - Maxime
        - Alexandre
        - Julien
        - Mathieu
        - Nicolas
        - Clement
        - Guillaume
        - Tristan
        - Bastien
        - Adrien
        - Laurent
        - Romain
        - Florian
        - Lucas
        - Gabriel
        - Olivier
        - Raphael
      feminine:
        - Camille
        - Juliette
        - Chloe
        - Manon
        - Ines
        - Lea
        - Amelie
        - Clemence
        - Marion
        - Elise
        - Helene
        - Delphine
        - Mathilde
        - Celine
        - Sylvie
        - Audrey
        - Charlotte
        - Margaux
        - Solene
        - Pauline
      neutral_or_archaic:
        - Claude
        - Dominique
        - Camille
        - Morgan
    last_names:
      - Laurent
      - Lefebvre
      - Mercier
      - Dupont
      - Fontaine
      - Chevalier
      - Renault
      - Gauthier
      - Perrin
      - Marchand
      - Lambert
      - Bonnet
      - Francois
      - Martinez
      - Legrand
      - Garnier
      - Faure
      - Rousseau
      - Vincent
      - Blanc
    prefixes:
      - "de "
      - "du "
      - "des "
      - "le "
      - "la "
    suffixes:
      - "-ier"
      - "-eau"
      - "-ette"
      - "-ot"
    toponyms:
      roots: ["ville", "mont", "val", "pont", "chateau", "bourg", "roc", "bois"]
      samples: ["Montclair", "Val-de-Grace", "Pont-Neuf", "Chateauneuf", "Bois-le-Duc", "Bourg-la-Reine"]

  modern_germanic_and_central_european:
    phonotactics: "Consonant clusters (sch, pf, ts, kn), glottal attacks, compound nominals, front rounded vowels (ö, ü)."
    first_names:
      masculine:
        - Lukas
        - Florian
        - Maximilian
        - Niklas
        - Jonas
        - Felix
        - Fabian
        - Moritz
        - Tobias
        - Sebastian
        - Jan
        - Hendrik
        - Stefan
        - Matthias
        - Christian
        - Philipp
        - Dominik
        - Simon
        - Marco
        - Daniel
      feminine:
        - Hannah
        - Lena
        - Laura
        - Julia
        - Sarah
        - Katharina
        - Anna
        - Lisa
        - Franziska
        - Melanie
        - Johanna
        - Nadine
        - Christina
        - Vanessa
        - Miriam
        - Annika
        - Teresa
        - Saskia
        - Jasmin
        - Carina
      neutral_or_archaic:
        - Kai
        - Eike
        - Rene
        - Kim
    last_names:
      - Richter
      - Schmidt
      - Schneider
      - Fischer
      - Weber
      - Meyer
      - Wagner
      - Becker
      - Schulz
      - Hoffmann
      - Schafer
      - Koch
      - Bauer
      - Klein
      - Wolf
      - Schroder
      - Neumann
      - Schwarz
      - Zimmermann
      - Braun
    prefixes:
      - "von "
      - "zu "
      - "van "
      - "de "
    suffixes:
      - "-er"
      - "-mann"
      - "-berg"
      - "-burg"
      - "-stein"
      - "-feld"
    toponyms:
      roots: ["burg", "berg", "stadt", "dorf", "bach", "wald", "furt", "haven"]
      samples: ["Rothenburg", "Eisenberg", "Neustadt", "Schwarzwald", "Frankfurt", "Bremerhaven"]

  modern_italian:
    phonotactics: "Vocalic endings (o, a, e, i), geminate double consonants (tt, ll, rr, cc), liquid trochees, lilting cadence."
    first_names:
      masculine:
        - Matteo
        - Lorenzo
        - Leonardo
        - Alessandro
        - Francesco
        - Gabriele
        - Davide
        - Andrea
        - Federico
        - Marco
        - Simone
        - Luca
        - Gianluca
        - Pietro
        - Riccardo
        - Tommaso
        - Filippo
        - Vincenzo
        - Giovanni
        - Salvatore
      feminine:
        - Giulia
        - Chiara
        - Francesca
        - Giorgia
        - Martina
        - Sara
        - Alessia
        - Silvia
        - Federica
        - Valentina
        - Elena
        - Simona
        - Beatrice
        - Elisa
        - Camilla
        - Alice
        - Eleonora
        - Ilaria
        - Veronica
        - Serena
      neutral_or_archaic:
        - Fiore
        - Celeste
        - Rosario
    last_names:
      - Rossi
      - Ferrari
      - Russo
      - Bianchi
      - Romano
      - Colombo
      - Ricci
      - Marino
      - Greco
      - Bruno
      - Gallo
      - Conti
      - De Luca
      - Mancini
      - Costa
      - Giordano
      - Rizzo
      - Lombardi
      - Moretti
      - Barbieri
    prefixes:
      - "Don "
      - "de "
      - "di "
      - "del "
      - "della "
    suffixes:
      - "-ini"
      - "-etti"
      - "-elli"
      - "-one"
    toponyms:
      roots: ["castello", "monte", "valle", "ponte", "borgo", "rocca", "porto", "riva"]
      samples: ["Castel Gandolfo", "Montepulciano", "Valdarno", "Roccalbegna", "Portofino", "Riva del Garda"]

  modern_contemporary_anglosphere:
    phonotactics: "Diverse, cosmopolitan, mixed Anglo-Saxon, Celtic, and international roots with modern urban nicknames."
    first_names:
      masculine:
        - Marcus
        - Ethan
        - Caleb
        - Lucas
        - Mason
        - Logan
        - Jackson
        - Tyler
        - Connor
        - Jordan
        - Austin
        - Trevor
        - Dylan
        - Brandon
        - Zachary
        - Justin
        - Derek
        - Travis
        - Kyle
        - Brett
      feminine:
        - Harper
        - Avery
        - Chloe
        - Peyton
        - Kendall
        - Morgan
        - Sydney
        - Brooke
        - Taylor
        - Paige
        - Sierra
        - Bailey
        - Chelsea
        - Shelby
        - Courtney
        - Amber
        - Whitney
        - Brittany
        - Heather
        - Lindsey
      neutral_or_archaic:
        - Jordan
        - Casey
        - Riley
        - Taylor
        - Morgan
        - Dakota
        - Quinn
        - Reese
    last_names:
      - Miller
      - Davis
      - Wilson
      - Taylor
      - Anderson
      - Thomas
      - Jackson
      - White
      - Harris
      - Martin
      - Thompson
      - Garcia
      - Martinez
      - Robinson
      - Clark
      - Rodriguez
      - Lewis
      - Lee
      - Walker
      - Hall
    prefixes:
      - "Mac"
      - "Mc"
      - "O'"
      - "Van "
    suffixes:
      - "-ton"
      - "-son"
      - "-field"
      - "-ford"
    toponyms:
      roots: ["city", "springs", "creek", "valley", "grove", "ridge", "harbor", "plains"]
      samples: ["Cedar Rapids", "Oak Ridge", "Silver Creek", "Grand Harbor", "Pine Valley", "Canyon City"]

  modern_southeast_asian:
    phonotactics: "Tonal monosyllables (Vietnamese), prefixation/infixation (Tagalog/Austronesian), vowel-final harmony (Indonesian/Malay)."
    first_names:
      masculine:
        - Minh
        - Duc
        - Tuan
        - Huy
        - Bao
        - Somchai
        - Arthit
        - Prasert
        - Kiet
        - Danilo
        - Bayani
        - Aris
        - Joko
        - Budi
        - Rizky
        - Aditya
        - Hendra
        - Fajar
        - Surya
        - Ilham
      feminine:
        - Linh
        - Huong
        - Mai
        - Lan
        - Anh
        - Mali
        - Siriporn
        - Kanya
        - Marites
        - Tala
        - Luningning
        - Dalisay
        - Dewi
        - Putri
        - Ratna
        - Sari
        - Wulandari
        - Nur
        - Siti
        - Indah
      neutral_or_archaic:
        - Van
        - Thanh
        - Binh
        - An
        - Kim
    last_names:
      - Nguyen
      - Tran
      - Le
      - Pham
      - Hoang
      - Phan
      - Vu
      - Dang
      - Bui
      - Do
      - Santos
      - Reyes
      - Cruz
      - Bautista
      - Ocampo
      - Wijaya
      - Kusuma
      - Sukarno
      - Siregar
      - Nasution
    prefixes:
      - "Bapak "
      - "Ibu "
      - "Ku "
      - "Nong "
    suffixes:
      - "-wan"
      - "-wati"
      - "-anto"
    toponyms:
      roots: ["nakhon", "song", "kuala", "bukit", "pulau", "muang", "dong", "song"]
      samples: ["Kuala Lumpur", "Bukit Timah", "Pulau Ubin", "Muang Mai", "Nakhon Pathom", "Dong Nai"]

  modern_indigenous_and_pacific:
    phonotactics: "Open CV syllables (Polynesian), long geminate vowels, glottal stops (ʻokina), consonant harmony, nature-grounded stems."
    first_names:
      masculine:
        - Keanu
        - Nainoa
        - Kawika
        - Ikaika
        - Tamati
        - Rawiri
        - Tane
        - Hemi
        - Nikau
        - Sione
        - Viliami
        - Manu
        - Kauri
        - Tawake
        - Chetan
        - Kiona
        - Enoli
        - Ahanu
        - Chayton
        - Dyami
      feminine:
        - Moana
        - Leilani
        - Malia
        - Alana
        - Aroha
        - Ngaire
        - Marama
        - Pania
        - Kiri
        - Sina
        - Mele
        - Tala
        - Teuila
        - Winona
        - Chenoa
        - Halona
        - Nizhoni
        - Ayita
        - Tallulah
        - Kateri
      neutral_or_archaic:
        - Keahi
        - Makana
        - Kahu
        - Teagan
        - Kai
    last_names:
      - Kalama
      - Kealoha
      - Akana
      - Kamaka
      - Henare
      - Te Wiata
      - Parata
      - Tipene
      - Fifita
      - Tuilagi
      - Vunipola
      - Tagovailoa
      - Begay
      - Yazzie
      - Tsosie
      - Nez
      - Benally
      - Chee
      - Yellowhair
      - Blackhorse
    prefixes:
      - "Te "
      - "Nga "
      - "Hono "
    suffixes:
      - "-nui"
      - "-roa"
      - "-iti"
    toponyms:
      roots: ["wai", "maunga", "motu", "awa", "roto", "puke", "tai"]
      samples: ["Waikato", "Maunganui", "Rotorua", "Motueka", "Aotearoa", "Pukekohe"]

genres:
  high_speculative_archaic:
    phonotactics: "Flowing sonorants, melodic vowel alternation, archaic cadences, zero synthetic random apostrophes."
    first_names:
      masculine:
        - Faelen
        - Thalion
        - Vaelin
        - Orestes
        - Brandis
        - Caelian
        - Daerion
        - Evandar
        - Galen
        - Heliodor
        - Ivaron
        - Lorian
        - Marcion
        - Nevrin
        - Ordel
        - Paeran
        - Rholand
        - Sylvan
        - Theran
        - Valdemar
      feminine:
        - Elyndra
        - Melisande
        - Morwenna
        - Thessalia
        - Aveline
        - Belladonna
        - Calanthe
        - Damaris
        - Evadne
        - Fianna
        - Gwenhwyfar
        - Isolda
        - Jovian
        - Kerensa
        - Laurelin
        - Mirella
        - Nimue
        - Oriana
        - Rosamund
        - Vespera
    last_names:
      - Silverwood
      - Dunharrow
      - Wintermere
      - Oakenshield
      - Crownhaven
      - Sallowbrook
      - Bramblevale
      - Fairweather
      - Stonegrave
      - Highgate
      - Fallowell
      - Redwyne
      - Blackthorn
      - Westerford
      - Ironspire
    toponyms:
      roots: ["harrow", "mere", "fell", "tor", "weald", "dell", "spire", "vale"]
      samples: ["Dunharrow", "Cinderfell", "Gallowmere", "Blackweald", "Highspire", "Brambletor"]

  clan_and_stone_subterranean:
    phonotactics: "Heavy voiced plosives (b, d, g), dental clusters (rt, nd, rk), deep guttural vowels, industrial/forge roots."
    first_names:
      masculine:
        - Torin
        - Borgan
        - Duergar
        - Kaelgr
        - Brokk
        - Dunstan
        - Fundin
        - Groth
        - Harek
        - Kazador
        - Morgrum
        - Norgrim
        - Orin
        - Rurik
        - Skalf
        - Thrum
        - Ulfar
        - Vondur
        - Wulfrun
        - Zarek
      feminine:
        - Brunhild
        - Helga
        - Dagmar
        - Gerta
        - Barba
        - Dagna
        - Freydis
        - Gunra
        - Hrefna
        - Katla
        - Magnhild
        - Ragnhild
        - Sigrun
        - Thordis
        - Torhild
        - Ulfhild
        - Valdis
        - Vigdis
        - Yrsa
        - Asa
    last_names:
      - Deepdelver
      - Forgehammer
      - Ironfoot
      - Stonebrow
      - Coppervein
      - Hearthwatcher
      - Anvilguard
      - Bittercrag
      - Cleftrock
      - Flintcarver
      - Granitefist
      - Orebreaker
      - Slatecutter
      - Tallowhearth
      - Vaultwarden
    toponyms:
      roots: ["crag", "delve", "vault", "cleft", "deep", "forge", "gate", "vein"]
      samples: ["Kazad-Crag", "Deepvault", "Bitterdelve", "Ironcleft", "Granitegate", "Anvilreach"]

  grimdark_and_gothic:
    phonotactics: "Ashen plosives, ecclesiastical Latinate friction, decayed vowels, blunt mono-syllables paired with pompous ancestral tags."
    first_names:
      masculine:
        - Malachai
        - Gideon
        - Caleb
        - Absalom
        - Enoch
        - Bartimaeus
        - Crispin
        - Donald
        - Ebenezer
        - Finnegan
        - Gregor
        - Hezekiah
        - Ignatius
        - Jedidiah
        - Klaus
        - Lazarus
        - Mordecai
        - Nathan
        - Osmund
        - Phineas
      feminine:
        - Hester
        - Prudence
        - Mercy
        - Constance
        - Abigail
        - Bathsheba
        - Charity
        - Dorcas
        - Eunice
        - Faith
        - Griselda
        - Hepsibah
        - Judith
        - Keziah
        - Leah
        - Miriam
        - Naomi
        - Patience
        - Rachel
        - Tabitha
    last_names:
      - Vane
      - Malcor
      - Caine
      - Gallowglass
      - Rood
      - Corpsewood
      - Bleakley
      - Wormwood
      - Ashworth
      - Blackwood
      - Callow
      - Dearth
      - Graves
      - Grimshaw
      - Harrow
      - Mortlock
      - Nethercoat
      - Skelton
      - Scurlock
      - Tolliver
    toponyms:
      roots: ["mire", "gallows", "tomb", "gibbet", "ossuary", "barrow", "weald", "pit"]
      samples: ["Gallowmire", "Barrow-on-Hill", "Gibbet-End", "Ossuary Reach", "Dead-Weald", "Wormwood Basin"]

  cyberpunk_and_sprawl:
    phonotactics: "Monosyllabic street handles, corporate brand names as surnames, alphanumeric serial designations, harsh fricatives."
    first_names:
      handles:
        - Case
        - Dash
        - Dex
        - Jinx
        - Zero
        - Raze
        - Null
        - Chrome
        - Wire
        - Flux
        - Patch
        - Glitch
        - Static
        - Spark
        - Coil
        - Slate
        - Vector
        - Echo
        - Grip
        - Solder
      corporate_legal:
        - Marcus
        - Evelyn
        - David
        - Victoria
        - Vincent
        - Helena
        - Julian
        - Adrienne
        - Conrad
        - Cecile
    last_names:
      - Vance-Mitsui
      - Arasaka-Sloan
      - Sterling
      - Weyland
      - Hex
      - Vane
      - Cross
      - Cyberdyne
      - Kurosawa
      - Chen-Vanderbilt
      - Rostov-Bio
      - Novik
      - Brandt
      - Holo
      - Syntech
      - Gridley
      - Sumpter
      - Mercer
      - Albright
      - Tanaka-Cruz
    toponyms:
      roots: ["grid", "sprawl", "corridor", "sump", "level", "dock", "tower", "conduit"]
      samples: ["Sump Level 4", "Sub-Corridor B", "High-Dock Seven", "Grid-East Industrial", "The Flop Sprawl", "Conduit 9"]

  hard_scifi_and_space_opera:
    phonotactics: "Astronomical Latin roots, ship-berth designations, colonist hybrid surnames, clipped efficient communication."
    first_names:
      masculine:
        - Orion
        - Corvus
        - Cassian
        - Tycho
        - Kepler
        - Linus
        - Aldrin
        - Cassini
        - Drake
        - Encke
        - Fabian
        - Goddard
        - Herschel
        - Ilya
        - Jovian
        - Kuiper
        - Leonid
        - Marius
        - Oberon
        - Sagan
      feminine:
        - Astrid
        - Vesper
        - Callisto
        - Rhea
        - Danica
        - Europa
        - Galatea
        - Halley
        - Io
        - Juno
        - Larissa
        - Miranda
        - Nova
        - Ophelia
        - Portia
        - Solis
        - Thalassa
        - Urania
        - Vega
    last_names:
      - Vance-Solari
      - Cross-Navarre
      - Obregon
      - Lindholm-Vega
      - Chen-Goddard
      - Al-Mansoor-Station
      - Petrov-09
      - Singh-Orbital
      - Kowalski-Vanguard
      - Tanaka-Transit
      - Duval
      - Mercer
      - Faraday
      - Halley
      - Vane-Kuiper
    toponyms:
      roots: ["reach", "station", "rim", "trough", "lagrange", "terminus", "berth", "crater"]
      samples: ["Lagrange Point 3", "Terminus Station", "Kepler Rim", "Trough Basin", "Berth 11-Alpha", "Vanguard Reach"]

  noir_and_hardboiled:
    phonotactics: "Short, punchy, cynical names with harsh stops and hard-boiled cadence. Easy to spit through a cigarette."
    first_names:
      masculine:
        - Jack
        - Frank
        - Eddie
        - Vince
        - Sal
        - Ray
        - Leo
        - Danny
        - Mac
        - Hank
        - Tony
        - Lou
        - Gus
        - Pete
        - Nick
        - Artie
        - Tommy
        - Carmine
        - Rocco
        - Benny
      feminine:
        - Roxie
        - Dolores
        - Kitty
        - Mae
        - Vera
        - Connie
        - Rita
        - Faye
        - Gloria
        - Donna
        - Peg
        - Lois
        - Stella
        - Marge
        - Wanda
        - Vivian
        - Cleo
        - Iris
        - Maxine
        - Ruby
    last_names:
      - Malloy
      - Spade
      - Marlowe
      - Caine
      - Costello
      - O'Leary
      - Novak
      - Brennan
      - Rossi
      - Falco
      - Callahan
      - DeLuca
      - Scarpelli
      - Sullivan
      - Gidley
      - Madigan
      - Corcoran
      - Valenti
      - Sweeney
      - Finney
    toponyms:
      roots: ["pier", "docks", "alley", "basin", "yard", "district", "wharf", "avenue"]
      samples: ["Pier 42", "Canal Wharf", "The Meat-Yard", "Tenement Row", "Slicker Basin", "Dead-End Alley"]

prefixes_registry:
  honorific_feudal:
    - "Lord "
    - "Lady "
    - "Dame "
    - "Sir "
    - "Archon "
    - "High-Justiciar "
    - "Castellan "
    - "Viceroy "
    - "Baron "
    - "Countess "
  lineage_patronymic:
    - "Mac"
    - "Mc"
    - "O'"
    - "Fitz-"
    - "Al-"
    - "Ibn-"
    - "Ben-"
    - "Von "
    - "Van "
    - "De "
    - "Di "
    - "Ap "
  speculative_clan:
    - "Cor-"
    - "Vael-"
    - "Thal-"
    - "Iron-"
    - "Stone-"
    - "Storm-"
    - "Ash-"
    - "Shadow-"
    - "Cleft-"
    - "Dune-"
  street_moniker:
    - "Old "
    - "Little "
    - "Big "
    - "Doc "
    - "Red "
    - "Blind "
    - "Crazy "
    - "Dead-Eye "
    - "Two-Tone "
    - "Slick "

suffixes_registry:
  kinship_patronymic:
    - "-son"
    - "-sen"
    - "-dottir"
    - "-ovich"
    - "-evna"
    - "-ez"
    - "-es"
    - "-opoulos"
    - "-ski"
    - "-ska"
    - "-ian"
    - "-zadeh"
  diminutive_affectionate:
    - "-kin"
    - "-ling"
    - "-ette"
    - "-let"
    - "-ik"
    - "-ya"
    - "-el"
    - "-in"
  occupational_craft:
    - "-smith"
    - "-wright"
    - "-ward"
    - "-monger"
    - "-weaver"
    - "-forged"
    - "-carver"
    - "-tallow"
    - "-mason"
    - "-driver"
  speculative_technical:
    - "-prime"
    - "-IX"
    - "-01"
    - "-dex"
    - "-core"
    - "-syn"
    - "-lux"
    - "-strand"
    - "-net"
    - "-sub"
  speculative_archaic:
    - "-or"
    - "-is"
    - "-an"
    - "-wen"
    - "-mir"
    - "-ael"
    - "-dor"
    - "-gard"
    - "-wyn"
    - "-glen"

mashup_morphemes:
  hard_plosives:
    onsets: ["Bar", "Tor", "Krag", "Gor", "Drak", "Brak", "Khol", "Tur", "Borg", "Dur"]
    nuclei: ["ok", "ar", "ug", "ak", "or", "ur", "ek", "ad"]
    codas: ["gan", "dun", "gar", "rak", "kar", "tusk", "grim", "gath", "karn", "garr"]
  soft_liquids:
    onsets: ["Val", "Mor", "Sil", "Lir", "El", "Mel", "Sel", "Ren", "Ven", "Lan"]
    nuclei: ["en", "il", "or", "an", "is", "el", "ar", "ia"]
    codas: ["wen", "iel", "mir", "lis", "dor", "mar", "lon", "las", "nis", "rell"]
  sibilants_and_fricatives:
    onsets: ["Zan", "Scy", "Vesper", "Fael", "Zul", "Thal", "Zeph", "Ser", "Cael", "Vex"]
    nuclei: ["ys", "ir", "eth", "az", "iv", "oth", "ux", "ith"]
    codas: ["ria", "xis", "thor", "zhan", "vash", "sith", "ra", "zan", "tis", "vorn"]
  guttural_and_deep:
    onsets: ["Grom", "Khor", "Urg", "Morg", "Bhol", "Durg", "Hrag", "Vrag", "Skor", "Gol"]
    nuclei: ["og", "ar", "ur", "akh", "org", "ul", "od", "ugh"]
    codas: ["mak", "zug", "thul", "rok", "gash", "dur", "vok", "grim", "bash", "gar"]

toponymic_compounds:
  specifiers:
    - "Black"
    - "Cold"
    - "High"
    - "Iron"
    - "Broad"
    - "Deep"
    - "Crow"
    - "Fox"
    - "Fallow"
    - "Red"
    - "Clay"
    - "Ash"
    - "Stone"
    - "Nether"
    - "Oakhill"
    - "Bramble"
    - "Dead"
    - "Bitter"
  eroded_endings:
    - "ford"
    - "ham"
    - "wick"
    - "stead"
    - "ton"
    - "tarn"
    - "shaw"
    - "mere"
    - "glen"
    - "haven"
    - "gate"
    - "dell"
    - "fell"
    - "weald"
    - "harrow"
    - "crag"
```
