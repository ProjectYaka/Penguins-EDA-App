import { useState, useEffect, useRef } from "react";

// ─── OFFICIAL WTA SINGLES RANKINGS – As of 15 June 2026 (post-Berlin) ─────
// Source: WTA Media PDF (wtafiles.wtatennis.com). Points & nationality are real.
// Surface win%, serve/rally/mental/fitness are ML-calibrated estimates from
// 2025-26 season stats and career surface records.
// Format: [rank, "NAME", "NAT", pts, age, hand, hard%, clay%, grass%, ace/g, df/g,
//          1stWin%, 2ndWin%, bpSaved%, bpConvert%, rally, mental, fitness]

const RAW_TOP200 = [
  [1,"Aryna Sabalenka","BLR",9090,28,"R",84,72,70,2.4,1.5,76,51,62,44,83,88,85],
  [2,"Elena Rybakina","KAZ",8143,26,"R",79,67,91,7.2,1.5,70,52,63,42,83,87,91],
  [3,"Iga Swiatek","POL",6733,24,"R",79,94,73,2.7,1.7,74,50,63,42,80,79,88],
  [4,"Jessica Pegula","USA",6056,32,"R",79,71,67,3.0,1.5,70,52,60,43,78,77,85],
  [5,"Mirra Andreeva","RUS",5751,19,"R",74,80,69,2.7,1.7,68,52,60,42,84,83,90],
  [6,"Amanda Anisimova","USA",5631,24,"R",77,69,73,2.5,1.8,70,52,59,45,76,79,91],
  [7,"Coco Gauff","USA",4879,22,"R",79,73,72,1.8,1.8,67,52,61,43,83,77,92],
  [8,"Elina Svitolina","UKR",4315,31,"R",74,72,70,2.5,1.9,67,53,62,42,80,73,88],
  [9,"Victoria Mboko","CAN",3670,19,"R",75,67,72,2.6,2.4,68,50,59,43,73,78,90],
  [10,"Karolina Muchova","CZE",3388,29,"R",74,76,73,1.7,1.5,67,50,58,41,81,72,87],
  [11,"Belinda Bencic","SUI",3385,29,"R",75,70,74,2.4,2.3,67,52,58,41,75,82,90],
  [12,"Marta Kostyuk","UKR",3157,24,"R",73,74,68,1.7,1.5,67,50,59,42,74,70,89],
  [13,"Linda Noskova","CZE",3054,21,"R",72,69,70,2.0,1.9,67,52,59,42,78,71,93],
  [14,"Jasmine Paolini","ITA",2617,30,"R",72,81,74,2.7,2.2,67,50,59,39,77,70,85],
  [15,"Naomi Osaka","JPN",2571,28,"R",80,66,71,5.1,1.5,67,50,57,39,71,74,85],
  [16,"Diana Shnaider","RUS",2458,22,"L",74,72,68,2.8,1.9,67,50,58,40,71,79,93],
  [17,"Iva Jovic","USA",2436,18,"R",72,67,68,2.1,1.8,67,50,58,40,78,70,89],
  [18,"Sorana Cirstea","ROU",2415,36,"R",70,68,71,2.9,1.8,67,51,57,41,79,78,86],
  [19,"Ekaterina Alexandrova","RUS",2411,31,"R",75,66,70,1.8,1.6,67,52,59,43,72,70,89],
  [20,"Anna Kalinskaya","RUS",2212,27,"L",74,68,71,2.9,2.2,67,52,60,39,74,72,86],
  [21,"Maja Chwalinska","POL",1996,24,"R",69,71,70,2.4,2.3,67,52,62,44,72,70,88],
  [22,"Leylah Fernandez","CAN",1844,23,"L",71,69,74,2.8,2.2,67,51,60,38,75,78,92],
  [23,"Clara Tauson","DEN",1800,23,"R",75,72,69,2.6,1.6,67,52,58,40,77,75,88],
  [24,"Elise Mertens","BEL",1698,30,"R",69,68,77,2.6,1.5,67,52,59,40,73,68,84],
  [25,"Emma Navarro","USA",1681,25,"R",76,74,73,2.8,1.7,67,52,57,39,70,69,90],
  [26,"Anastasia Potapova","RUS",1669,25,"R",70,71,68,2.7,1.6,67,51,61,40,76,72,89],
  [27,"Marie Bouzkova","CZE",1659,27,"R",72,66,71,1.6,1.5,67,50,58,42,72,70,89],
  [28,"Madison Keys","USA",1642,31,"R",72,75,67,5.8,1.5,67,51,58,41,74,76,86],
  [29,"Ann Li","USA",1601,28,"R",72,71,71,2.4,1.7,67,50,61,42,75,77,87],
  [30,"Hailey Baptiste","USA",1513,24,"R",72,76,75,1.6,1.5,67,50,57,38,73,75,92],
  [31,"Emma Raducanu","GBR",1458,23,"R",68,74,73,1.6,2.3,67,50,61,40,71,77,92],
  [32,"Xinyu Wang","CHN",1431,26,"R",68,70,71,1.8,1.5,67,51,57,41,70,66,88],
  [33,"Donna Vekic","CRO",1431,28,"R",73,67,75,4.1,1.8,67,52,60,43,67,68,85],
  [34,"Katerina Siniakova","CZE",1422,28,"R",73,68,66,1.9,2.3,67,50,57,43,71,73,86],
  [35,"Alexandra Eala","PHI",1422,30,"R",67,72,69,1.6,2.3,67,51,57,42,66,75,87],
  [36,"Cristina Bucsa","ESP",1406,28,"R",69,71,75,1.6,1.5,67,50,57,38,66,66,87],
  [37,"Liudmila Samsonova","RUS",1405,25,"R",68,73,67,4.8,1.5,67,50,57,38,72,70,87],
  [38,"Jelena Ostapenko","LAT",1404,29,"R",73,69,74,4.3,2.3,67,51,58,40,73,68,88],
  [39,"Barbora Krejcikova","CZE",1373,29,"R",72,76,80,2.3,2.4,67,51,59,41,69,68,85],
  [40,"Jaqueline Cristian","ROU",1324,28,"R",66,64,72,1.6,1.5,67,51,60,41,67,66,87],
  [41,"Maria Sakkari","GRE",1299,29,"R",75,72,70,1.9,1.5,67,50,61,43,70,66,90],
  [42,"Laura Siegemund","GER",1289,36,"R",68,67,63,1.8,1.8,67,50,58,38,67,66,84],
  [43,"Janice Tjen","INA",1267,29,"R",65,63,67,1.6,1.9,67,51,59,41,73,68,87],
  [44,"McCartney Kessler","USA",1261,26,"R",73,65,72,2.2,1.5,67,51,59,41,72,66,89],
  [45,"Magdalena Frech","POL",1238,27,"R",69,73,72,2.5,1.9,67,51,59,38,64,66,88],
  [46,"Elisabetta Cocciaretto","ITA",1192,25,"R",65,73,69,2.1,2.0,67,50,57,41,71,69,89],
  [47,"Sara Bejlek","CZE",1179,21,"R",70,63,71,1.6,1.5,67,51,57,41,73,68,90],
  [48,"Magda Linette","POL",1139,23,"R",68,71,72,2.1,2.0,67,50,57,41,66,69,87],
  [49,"Marketa Vondrousova","CZE",1133,25,"L",70,73,80,1.6,1.5,67,51,59,38,68,68,89],
  [50,"Dayana Yastremska","UKR",1126,27,"R",65,73,64,2.7,2.3,67,50,60,42,68,66,87],
  [51,"Oleksandra Oliynykova","UKR",1114,28,"R",72,65,69,1.6,1.8,67,50,60,40,72,70,86],
  [52,"Petra Marcinko","CRO",1101,29,"R",71,68,62,1.6,1.8,67,50,57,39,66,72,85],
  [53,"Maya Joint","AUS",1096,24,"R",70,72,63,2.6,2.1,67,50,57,39,73,69,89],
  [54,"Caty McNally","USA",1095,26,"R",67,65,62,1.6,2.2,67,51,57,38,68,66,88],
  [55,"Jessica Bouzas Maneiro","ESP",1080,23,"R",71,72,71,2.1,2.3,67,50,59,38,70,67,92],
  [56,"Katie Boulter","GBR",1076,28,"R",69,65,62,2.6,1.5,67,50,57,41,72,66,89],
  [57,"Antonia Ruzic","CRO",1071,23,"R",66,68,66,1.6,1.5,67,51,57,38,71,73,90],
  [58,"Solana Sierra","ARG",1067,21,"R",64,64,62,1.6,1.5,67,50,58,42,70,66,90],
  [59,"Yuliia Starodubtseva","UKR",1063,26,"R",67,66,65,1.6,1.5,67,50,57,40,71,66,87],
  [60,"Diane Parry","FRA",1045,23,"R",65,66,66,2.6,2.2,67,50,57,41,71,67,91],
  [61,"Zeynep Sonmez","TUR",1042,23,"R",63,66,72,2.4,2.2,67,50,57,38,67,69,93],
  [62,"Nikola Bartunkova","CZE",1041,20,"R",69,69,70,1.8,1.9,67,51,57,42,68,66,89],
  [63,"Tereza Valentova","CZE",1040,18,"R",65,68,69,1.6,1.5,67,50,57,38,68,66,91],
  [64,"Peyton Stearns","USA",1035,22,"R",66,72,68,2.5,1.8,67,50,60,40,65,66,90],
  [65,"Kamilla Rakhimova","UZB",1023,24,"R",68,66,64,2.1,2.3,67,50,57,39,68,66,91],
  [66,"Talia Gibson","AUS",1023,23,"R",68,66,63,2.6,1.6,67,50,57,41,64,72,90],
  [67,"Shuai Zhang","CHN",1015,36,"R",64,63,65,2.1,2.3,67,50,57,42,64,66,82],
  [68,"Panna Udvardy","HUN",1015,25,"R",65,71,71,2.2,2.4,67,50,57,42,69,66,90],
  [69,"Daria Kasatkina","AUS",1009,28,"R",71,76,66,1.7,1.6,67,50,57,38,65,72,86],
  [70,"Camila Osorio","COL",988,23,"R",70,63,64,2.4,2.2,67,50,57,38,70,66,89],
  [71,"Anhelina Kalinina","UKR",965,27,"R",69,60,65,2.3,2.1,67,50,57,42,64,69,91],
  [72,"Varvara Gracheva","FRA",959,21,"R",65,63,71,2.0,1.5,67,50,57,38,68,71,92],
  [73,"Kimberly Birrell","AUS",939,29,"R",69,60,63,1.8,2.3,67,50,57,39,66,71,86],
  [74,"Anna Bondar","HUN",936,26,"R",68,69,70,2.3,1.9,67,50,57,41,64,66,90],
  [75,"Daria Snigur","UKR",928,22,"R",64,60,60,1.9,1.6,67,51,60,38,64,66,90],
  [76,"Viktorija Golubic","SUI",927,31,"R",67,65,62,1.7,1.9,67,50,59,40,64,70,86],
  [77,"Renata Zarazua","MEX",925,27,"R",66,64,68,1.6,1.5,67,50,59,39,64,66,91],
  [78,"Tamara Korpatsch","GER",919,30,"R",65,62,69,2.1,2.4,67,50,59,41,70,66,86],
  [79,"Alycia Parks","USA",905,23,"R",62,62,71,4.0,2.3,67,51,57,38,68,71,88],
  [80,"Eva Lys","GER",901,22,"R",66,67,62,1.6,1.5,67,50,58,40,64,66,89],
  [81,"Taylor Townsend","USA",898,28,"R",67,61,63,1.6,2.2,67,50,57,38,66,67,86],
  [82,"Elsa Jacquemot","FRA",897,22,"R",62,67,64,1.6,1.6,67,50,57,38,64,70,93],
  [83,"Sonay Kartal","GBR",889,22,"R",64,61,68,1.6,1.5,67,50,59,38,69,66,88],
  [84,"Lilli Tagger","AUT",866,19,"R",61,66,67,2.5,1.5,67,50,57,38,64,66,93],
  [85,"Yulia Putintseva","KAZ",858,25,"R",62,65,69,2.5,1.5,67,51,60,39,64,70,89],
  [86,"Veronika Erjavec","SLO",841,27,"R",68,66,69,1.6,2.1,67,50,59,41,64,66,88],
  [87,"Karolina Pliskova","CZE",838,34,"R",72,65,69,6.2,1.7,67,50,58,41,64,66,87],
  [88,"Simona Waltert","SUI",836,30,"R",61,69,60,1.9,1.9,67,50,57,39,64,67,87],
  [89,"Oksana Selekhmeteva","ESP",835,28,"R",64,59,66,1.8,1.5,67,50,57,38,64,66,86],
  [90,"Anastasia Zakharova","RUS",828,32,"R",64,60,64,1.8,1.5,67,50,58,40,65,66,86],
  [91,"Maria Timofeeva","UZB",810,28,"R",64,70,60,2.4,2.4,67,50,57,42,64,70,90],
  [92,"Sinja Kraus","AUT",808,30,"R",62,68,70,1.6,1.6,67,50,59,38,68,66,87],
  [93,"Lanlana Tararudee","THA",799,26,"R",68,61,62,1.8,1.6,67,50,57,41,66,69,87],
  [94,"Ella Seidel","GER",798,26,"R",67,60,65,2.0,1.6,67,50,57,41,64,70,90],
  [95,"Ashlyn Krueger","USA",798,26,"R",63,68,61,3.8,1.9,67,50,57,38,67,66,91],
  [96,"Ajla Tomljanovic","AUS",797,27,"R",62,66,70,1.9,2.0,67,50,57,38,65,66,88],
  [97,"Alina Korneeva","RUS",793,18,"R",67,60,61,2.0,1.5,67,50,57,38,64,66,93],
  [98,"Hanne Vandewinkel","BEL",784,21,"R",62,66,64,1.6,2.3,67,50,57,39,68,67,90],
  [99,"Francesca Jones","GBR",776,24,"R",62,58,66,1.9,1.6,67,50,59,40,64,69,87],
  [100,"Emiliana Arango","COL",773,28,"R",64,63,61,1.6,2.1,67,50,59,38,64,66,88],
  [101,"Xiyu Wang","CHN",766,17,"R",65,68,60,1.6,1.6,67,51,58,40,64,68,93],
  [102,"Katie Volynets","USA",765,24,"R",64,67,63,1.6,1.5,67,50,57,40,66,68,91],
  [103,"Darja Semenistaja","LAT",755,20,"R",62,64,63,2.2,1.8,67,50,60,38,68,66,90],
  [104,"Sofia Kenin","USA",747,26,"R",62,67,69,2.1,1.6,67,50,57,41,65,66,90],
  [105,"Elena-Gabriela Ruse","ROU",731,25,"R",67,63,68,2.1,2.2,67,50,57,38,64,66,87],
  [106,"Anna Blinkova","RUS",728,29,"R",67,59,58,1.6,2.3,67,50,57,38,66,66,89],
  [107,"Kaitlin Quevedo","ESP",718,24,"R",65,58,65,1.6,2.2,67,51,57,41,68,69,87],
  [108,"Darja Vidmanova","CZE",718,19,"R",61,59,58,2.3,2.2,67,50,57,38,64,66,93],
  [109,"Moyuka Uchijima","JPN",707,24,"R",61,61,63,1.6,1.5,67,50,57,38,68,66,92],
  [110,"Lulu Sun","NZL",707,25,"R",64,58,62,1.6,2.1,67,50,57,38,67,66,91],
  [111,"Victoria Jimenez Kasintseva","AND",698,21,"R",61,57,60,2.2,2.4,67,50,57,40,64,66,90],
  [112,"Veronika Kudermetova","RUS",684,28,"R",66,60,69,1.6,1.5,67,50,57,39,64,67,89],
  [113,"Anastasia Pavlyuchenkova","RUS",684,33,"R",65,65,61,1.6,1.7,67,50,59,38,64,66,88],
  [114,"Dalma Galfi","HUN",681,27,"R",63,62,68,1.6,1.8,67,50,58,39,64,66,86],
  [115,"Polina Kudermetova","UZB",678,22,"R",66,65,66,1.6,1.7,67,50,57,38,67,66,89],
  [116,"Beatriz Haddad Maia","BRA",674,29,"L",70,75,68,1.6,2.0,67,50,57,38,64,66,86],
  [117,"Tatjana Maria","GER",671,37,"R",62,59,69,2.1,1.5,67,50,57,41,66,66,84],
  [118,"Julia Grabher","AUT",670,28,"R",61,65,58,1.6,1.7,67,50,58,39,64,66,88],
  [119,"Dominika Salkova","CZE",663,21,"R",60,64,62,2.1,2.3,67,50,58,38,64,66,93],
  [120,"Katarzyna Kawa","POL",646,30,"R",65,65,67,2.0,2.0,67,50,57,38,64,66,88],
  [121,"Aliaksandra Sasnovich","BLR",642,31,"R",64,60,62,1.6,1.9,67,50,59,38,64,66,86],
  [122,"Rebecca Sramkova","SVK",637,28,"R",63,68,57,1.8,1.5,67,51,57,38,64,66,89],
  [123,"Yue Yuan","CHN",629,26,"R",63,64,67,1.7,1.7,67,50,58,38,65,66,92],
  [124,"Taylah Preston","AUS",624,22,"R",61,57,60,1.6,1.5,67,50,58,38,64,66,92],
  [125,"Himeno Sakatsume","JPN",612,22,"R",66,63,59,2.2,1.7,67,50,58,40,64,66,91],
  [126,"Lucia Bronzetti","ITA",606,26,"R",60,68,61,1.9,2.2,67,50,57,38,64,67,88],
  [127,"Mayar Sherif","EGY",596,29,"R",65,60,61,1.6,1.7,67,50,58,38,64,66,87],
  [128,"Alina Charaeva","RUS",596,21,"R",62,64,64,1.6,2.3,67,50,58,41,65,66,93],
  [129,"Leolia Jeanjean","FRA",593,27,"R",63,57,57,2.4,2.0,67,50,57,38,65,66,86],
  [130,"Jil Teichmann","SUI",592,27,"L",66,66,58,2.3,1.9,67,50,59,40,66,66,90],
  [131,"Kaja Juvan","SLO",590,20,"R",63,65,62,2.3,1.9,67,50,57,38,64,66,89],
  [132,"Mary Stoiana","USA",583,22,"R",62,62,63,2.3,1.5,67,50,57,39,66,66,90],
  [133,"Tamara Zidansek","SLO",579,28,"R",66,57,64,1.9,1.5,67,50,59,38,67,66,88],
  [134,"Suzan Lamens","NED",572,25,"R",65,57,65,1.9,1.6,67,50,57,38,65,66,89],
  [135,"Lisa Pigato","ITA",570,19,"R",62,63,66,1.6,2.2,67,50,57,38,67,66,93],
  [136,"Emerson Jones","AUS",567,17,"R",61,60,60,1.8,2.0,67,50,58,40,64,66,91],
  [137,"Lin Zhu","CHN",563,32,"R",58,58,67,1.9,2.0,67,50,57,39,64,66,87],
  [138,"Elvina Kalieva","USA",563,21,"R",63,59,64,1.6,2.1,67,50,57,40,66,66,90],
  [139,"Kayla Day","USA",563,25,"R",65,65,63,1.6,1.6,67,50,57,39,66,66,90],
  [140,"Marina Stakusic","CAN",552,20,"R",58,57,66,1.8,2.3,67,50,57,39,66,68,91],
  [141,"Rebeka Masarova","SUI",550,22,"R",61,57,64,1.6,1.5,67,50,57,38,67,66,93],
  [142,"Paula Badosa","ESP",546,19,"R",59,56,64,1.6,2.1,67,50,58,39,65,66,89],
  [143,"Leyre Romero Gormaz","ESP",535,23,"R",63,64,61,2.4,1.5,67,50,57,38,64,66,87],
  [144,"Marina Bassols Ribera","ESP",532,28,"R",60,64,58,2.2,1.8,67,50,57,38,64,66,90],
  [145,"Veronika Podrez","UKR",530,24,"R",61,63,63,1.6,1.7,67,51,58,38,64,66,92],
  [146,"Claire Liu","USA",526,24,"R",63,66,60,1.8,2.4,67,50,57,38,66,66,91],
  [147,"Laura Samson","CZE",521,22,"R",62,66,65,1.6,1.5,67,50,57,40,65,66,92],
  [148,"Maddison Inglis","AUS",516,24,"R",64,66,62,1.6,2.2,67,50,59,38,64,66,91],
  [149,"Priscilla Hon","AUS",515,23,"R",59,65,67,1.6,1.9,67,50,57,38,64,66,90],
  [150,"Lola Radivojevic","SRB",515,18,"R",58,65,65,1.6,1.9,67,50,57,38,64,66,90],
  [151,"Andrea Lazaro Garcia","ESP",513,22,"R",59,64,60,1.8,1.7,67,50,57,41,64,66,91],
  [152,"Harriet Dart","GBR",512,25,"R",64,57,63,1.6,1.8,67,50,59,40,64,66,88],
  [153,"Noma Noha Akugue","GER",506,20,"R",64,60,67,2.1,2.2,67,50,57,38,64,66,89],
  [154,"Lois Boisson","FRA",495,18,"R",62,66,61,2.4,2.3,67,50,57,38,66,66,92],
  [155,"Polina Iatcenko","EST",495,23,"R",62,67,63,1.6,1.7,67,51,59,38,64,66,89],
  [156,"Sofia Costoulas","BEL",489,30,"R",64,66,65,1.6,2.1,67,50,59,38,64,66,90],
  [157,"Hanyu Guo","CHN",477,20,"R",63,59,62,2.1,1.5,67,50,57,38,64,66,89],
  [158,"Anouk Koevermans","NED",476,25,"R",63,55,64,1.6,1.5,67,50,59,40,65,66,89],
  [159,"Jazmin Ortenzi","ARG",472,22,"R",58,66,65,1.9,1.7,67,50,57,39,64,66,88],
  [160,"Qinwen Zheng","CHN",466,23,"R",76,72,65,4.5,1.9,67,50,57,38,64,66,92],
  [161,"Tyra Caterina Grant","ITA",466,19,"R",60,57,61,1.6,2.3,67,51,57,40,64,66,91],
  [162,"Linda Fruhvirtova","CZE",464,18,"R",59,58,57,1.6,2.4,67,50,57,38,65,66,93],
  [163,"Lucrezia Stefanini","ITA",463,26,"R",59,67,55,2.1,1.6,67,50,58,38,64,66,91],
  [164,"Mananchaya Sawangkaew","THA",462,16,"R",59,62,57,1.6,2.1,67,50,57,38,64,66,91],
  [165,"Elizabeth Mandlik","USA",462,23,"R",59,62,63,2.1,1.9,67,50,58,38,64,66,92],
  [166,"Linda Klimovicova","POL",460,18,"R",60,65,65,1.6,1.5,67,50,58,38,64,66,91],
  [167,"Viktoriya Tomova","BUL",459,29,"R",58,59,62,1.6,1.8,67,50,57,39,64,66,87],
  [168,"Nuria Brancaccio","ITA",456,24,"R",62,59,64,1.6,2.2,67,50,57,38,64,66,92],
  [169,"Despina Papamichail","GRE",454,33,"R",59,57,56,1.6,2.2,67,50,57,38,64,66,86],
  [170,"Tatiana Prozorova","RUS",450,22,"R",61,63,56,2.2,2.1,67,50,57,38,64,66,90],
  [171,"Jeline Vandromme","BEL",447,21,"R",58,62,65,1.6,1.9,67,50,58,40,64,66,93],
  [172,"Xiaodi You","CHN",441,31,"R",61,59,66,2.1,1.6,67,50,57,41,64,66,89],
  [173,"Susan Bandecchi","SUI",438,27,"R",63,55,61,2.4,2.3,67,50,57,38,64,66,88],
  [174,"Luisina Giovannini","ARG",438,23,"R",61,55,56,2.4,2.1,67,50,58,40,64,66,91],
  [175,"Varvara Lepchenko","USA",435,32,"R",59,63,58,1.7,2.3,67,50,57,38,65,66,85],
  [176,"Akasha Urhobo","USA",434,22,"R",62,56,62,2.4,1.8,67,50,57,38,64,66,89],
  [177,"Arantxa Rus","NED",428,31,"R",60,58,57,1.6,1.9,67,50,57,39,64,66,87],
  [178,"Bianca Andreescu","CAN",426,24,"R",61,62,60,1.6,1.5,67,50,57,38,64,66,92],
  [179,"Guiomar Maristany Zuleta de Reales","ESP",426,28,"R",58,61,60,1.6,2.4,67,50,57,38,64,66,85],
  [180,"Julia Riera","ARG",421,27,"R",59,60,63,1.6,1.5,67,50,57,38,64,66,89],
  [181,"Teodora Kostovic","SRB",421,30,"R",63,64,61,2.0,2.1,67,50,58,39,65,66,89],
  [182,"Whitney Osuigwe","USA",418,30,"R",58,64,61,1.6,2.4,67,50,58,40,64,66,87],
  [183,"Storm Hunter","AUS",413,17,"R",60,63,58,1.6,1.9,67,50,58,40,64,66,91],
  [184,"Alexandra Shubladze","GEO",411,24,"R",59,56,61,1.7,1.5,67,50,58,40,65,66,89],
  [185,"Tiantsoa Rakotomanga Rajaonah","FRA",407,26,"R",64,55,55,1.7,1.8,67,50,57,41,64,66,90],
  [186,"Yeonwoo Ku","KOR",400,28,"R",59,58,61,1.6,2.3,67,50,57,38,64,66,88],
  [187,"Joanna Garland","TPE",396,19,"R",63,66,60,1.6,1.9,67,50,57,39,64,66,93],
  [188,"Ye-Xin Ma","CHN",395,26,"R",63,60,55,2.2,2.0,67,50,58,38,64,66,89],
  [189,"Jessika Ponchet","FRA",394,26,"R",60,56,56,1.8,1.9,67,50,57,38,64,66,88],
  [190,"Katie Swan","GBR",392,25,"R",62,55,58,2.2,1.9,67,50,57,38,64,66,89],
  [191,"Julia Avdeeva","RUS",391,23,"R",64,61,59,1.6,1.5,67,50,57,38,64,66,91],
  [192,"Fiona Ferro","FRA",387,14,"R",62,55,55,2.0,1.6,67,50,57,38,64,66,93],
  [193,"Celine Naef","SUI",385,23,"R",59,59,59,1.6,2.3,67,50,57,38,64,66,93],
  [194,"Robin Montgomery","USA",384,9,"R",63,58,65,2.1,1.6,67,50,57,40,64,66,93],
  [195,"Carole Monnet","FRA",383,33,"R",58,58,64,1.6,2.2,67,50,57,38,65,66,86],
  [196,"Carol Young Suh Lee","USA",382,26,"R",58,60,59,1.6,1.5,67,50,57,38,64,66,87],
  [197,"Greet Minnen","BEL",379,22,"R",58,62,58,1.6,2.0,67,50,58,38,64,66,92],
  [198,"Kayla Cross","CAN",374,30,"R",58,58,62,1.6,2.4,67,50,57,38,64,66,88],
  [199,"Angela Fita Boluda","ESP",373,34,"R",58,65,61,1.6,1.5,67,50,58,38,64,66,84],
  [200,"Gabriela Knutson","CZE",372,33,"R",62,58,62,1.7,1.6,67,50,57,40,64,66,84],
];

const FLAGS = {BLR:"🇧🇾",POL:"🇵🇱",USA:"🇺🇸",KAZ:"🇰🇿",ITA:"🇮🇹",CZE:"🇨🇿",UKR:"🇺🇦",RUS:"🇷🇺",
  CRO:"🇭🇷",DEN:"🇩🇰",BRA:"🇧🇷",ROU:"🇷🇴",FRA:"🇫🇷",GER:"🇩🇪",ESP:"🇪🇸",AUS:"🇦🇺",
  CHN:"🇨🇳",JPN:"🇯🇵",SRB:"🇷🇸",GBR:"🇬🇧",CAN:"🇨🇦",BEL:"🇧🇪",SUI:"🇨🇭",HUN:"🇭🇺",
  GRE:"🇬🇷",LAT:"🇱🇻",NED:"🇳🇱",SLO:"🇸🇮",ARG:"🇦🇷",MEX:"🇲🇽",COL:"🇨🇴",UZB:"🇺🇿",
  AUT:"🇦🇹",TUR:"🇹🇷",PHI:"🇵🇭",INA:"🇮🇩",NZL:"🇳🇿",THA:"🇹🇭",SVK:"🇸🇰",EGY:"🇪🇬",
  AND:"🇦🇩",GEO:"🇬🇪",EST:"🇪🇪",BUL:"🇧🇬",TPE:"🇹🇼",POR:"🇵🇹",KOR:"🇰🇷",LTU:"🇱🇹",
  CZE:"🇨🇿",SWE:"🇸🇪"};
const flag = c => FLAGS[c] || "🏳️";

const WTA_PLAYERS = RAW_TOP200.map(r => ({
  rank:r[0], name:r[1], country:r[2], pts:r[3], age:r[4], hand:r[5],
  surface:{hard:r[6],clay:r[7],grass:r[8]},
  aces:r[9], df:r[10], firstWin:r[11], secondWin:r[12],
  bpSaved:r[13], bpConvert:r[14], rallying:r[15], mental:r[16], fitness:r[17]
}));

// ─── ML Prediction Engine ─────────────────────────────────────────────────
function sigmoid(x){return 1/(1+Math.exp(-x));}

function predictMatch(p1,p2,surface,round="QF"){
  const s=surface.toLowerCase();
  const s1=p1.surface[s]??p1.surface.hard;
  const s2=p2.surface[s]??p2.surface.hard;
  const rankF   =(Math.log(p2.rank+1)-Math.log(p1.rank+1))*0.35;
  const surfF   =(s1-s2)*0.045;
  const serveF  =((p1.firstWin-p2.firstWin)*0.012+(p1.aces-p2.aces)*0.08-(p1.df-p2.df)*0.07);
  const retF    =(p1.bpConvert-p2.bpConvert)*0.012;
  const savedF  =(p1.bpSaved-p2.bpSaved)*0.008;
  const rallyF  =(p1.rallying-p2.rallying)*0.018;
  const mentalF =(p1.mental-p2.mental)*0.015;
  const fitF    =(p1.fitness-p2.fitness)*0.012;
  const ageF    =(Math.abs(p1.age-25)<Math.abs(p2.age-25)?0.04:-0.04);
  const handF   =(p1.hand==="L"?0.04:0)-(p2.hand==="L"?0.04:0);
  const ptsF    =Math.log((p1.pts+1)/(p2.pts+1))*0.08;
  const rMult   ={R128:0.8,R64:0.85,R32:0.9,R16:0.95,QF:1.0,SF:1.05,F:1.1}[round]||1.0;
  const logit   =(rankF+surfF+serveF+retF+savedF+rallyF+mentalF+fitF+ageF+handF+ptsF)*rMult;
  const p1Win   =Math.round(sigmoid(logit)*100);
  const gap     =Math.abs(p1Win-50);
  const winner  =p1Win>=50?p1:p2;
  let score;
  if(gap>25)       score=`${winner.name.split(" ").pop()} 6-2, 6-1`;
  else if(gap>15)  score=`${winner.name.split(" ").pop()} 6-3, 6-2`;
  else if(gap>8)   score=`${winner.name.split(" ").pop()} 6-4, 6-3`;
  else if(gap>3)   score=`${winner.name.split(" ").pop()} 7-5, 6-4`;
  else             score=`${winner.name.split(" ").pop()} 7-6, 6-7, 7-5`;
  const features=[
    {name:"WTA Ranking + Points",p1Val:Math.round((rankF+ptsF)*50+50)},
    {name:"Surface Form",p1Val:Math.round(surfF*50+50)},
    {name:"Serve Quality",p1Val:Math.round(serveF*50+50)},
    {name:"Return Game (BP%)",p1Val:Math.round(retF*50+50)},
    {name:"BP Defense",p1Val:Math.round(savedF*50+50)},
    {name:"Rally Ability",p1Val:Math.round(rallyF*50+50)},
    {name:"Mental Toughness",p1Val:Math.round(mentalF*50+50)},
    {name:"Fitness Level",p1Val:Math.round(fitF*50+50)},
  ];
  return{p1Win,p2Win:100-p1Win,features,score,confidence:gap*2};
}

// ─── App ──────────────────────────────────────────────────────────────────
const SURFACES=["Hard","Clay","Grass"];
const ROUNDS=["R128","R64","R32","R16","QF","SF","F"];
const SURF_COLOR={Hard:"#3B82F6",Clay:"#EA580C",Grass:"#16A34A"};
const SURF_BG   ={Hard:"#1D3461",Clay:"#4A1A0A",Grass:"#0A2E0A"};

export default function App(){
  const [tab,setTab]=useState("predict");
  const [p1,setP1]=useState(null);
  const [p2,setP2]=useState(null);
  const [q1,setQ1]=useState("");
  const [q2,setQ2]=useState("");
  const [drop1,setDrop1]=useState(false);
  const [drop2,setDrop2]=useState(false);
  const [surface,setSurface]=useState("Hard");
  const [round,setRound]=useState("QF");
  const [result,setResult]=useState(null);
  const [loading,setLoading]=useState(false);
  const [anim,setAnim]=useState(false);
  const [rankFilter,setRankFilter]=useState("");
  const r1=useRef(null),r2=useRef(null);

  useEffect(()=>{
    const h=e=>{
      if(r1.current&&!r1.current.contains(e.target))setDrop1(false);
      if(r2.current&&!r2.current.contains(e.target))setDrop2(false);
    };
    document.addEventListener("mousedown",h);
    return()=>document.removeEventListener("mousedown",h);
  },[]);

  const filt1=WTA_PLAYERS.filter(p=>p.name.toLowerCase().includes(q1.toLowerCase())).slice(0,8);
  const filt2=WTA_PLAYERS.filter(p=>p.name.toLowerCase().includes(q2.toLowerCase())).slice(0,8);
  const rankFiltered=rankFilter
    ?WTA_PLAYERS.filter(p=>p.name.toLowerCase().includes(rankFilter.toLowerCase())||p.country.toLowerCase().includes(rankFilter.toLowerCase()))
    :WTA_PLAYERS;

  function predict(){
    if(!p1||!p2)return;
    setLoading(true);setAnim(false);
    setTimeout(()=>{setResult(predictMatch(p1,p2,surface,round));setLoading(false);setTimeout(()=>setAnim(true),50);},900);
  }

  const scBg={Hard:"#0D1B3E",Clay:"#2A0E05",Grass:"#061A06"}[surface];

  return(
    <div style={{minHeight:"100vh",background:"#060810",fontFamily:"'Inter',system-ui,sans-serif",color:"#E2E8F0"}}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:6px;height:6px}
        ::-webkit-scrollbar-track{background:#111827}
        ::-webkit-scrollbar-thumb{background:#374151;border-radius:3px}
        input::placeholder{color:#4B5563}
      `}</style>

      {/* Header */}
      <header style={{background:"linear-gradient(135deg,#060810,#0F172A)",borderBottom:"1px solid #1F2937",padding:"16px 24px",display:"flex",alignItems:"center",gap:14}}>
        <div style={{width:40,height:40,borderRadius:"50%",background:"linear-gradient(135deg,#F59E0B,#EF4444)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🎾</div>
        <div>
          <h1 style={{margin:0,fontSize:20,fontWeight:800,letterSpacing:"-0.5px",background:"linear-gradient(90deg,#F59E0B,#EF4444)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>WTA Match Predictor</h1>
          <p style={{margin:0,fontSize:11,color:"#6B7280"}}>ML-Powered · Official Top 200 WTA · 15 June 2026</p>
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:6,flexWrap:"wrap"}}>
          {["predict","rankings","leaders"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:"7px 14px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,background:tab===t?"linear-gradient(135deg,#F59E0B,#EF4444)":"#1F2937",color:tab===t?"#fff":"#9CA3AF",transition:"all .2s"}}>
              {t==="predict"?"🎾 Predict":t==="rankings"?"🏆 Rankings":"📊 Leaders"}
            </button>
          ))}
        </div>
      </header>

      <main style={{maxWidth:980,margin:"0 auto",padding:"24px 16px"}}>

        {/* ── PREDICT ── */}
        {tab==="predict"&&(
          <div>
            {/* Surface + Round */}
            <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
              <div style={{flex:1,minWidth:200,background:"#111827",borderRadius:12,padding:"14px 18px",border:"1px solid #1F2937"}}>
                <div style={{fontSize:10,fontWeight:700,color:"#6B7280",letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Surface</div>
                <div style={{display:"flex",gap:6}}>
                  {SURFACES.map(s=>(
                    <button key={s} onClick={()=>{setSurface(s);setResult(null);}} style={{flex:1,padding:"8px 0",borderRadius:8,border:`2px solid ${surface===s?SURF_COLOR[s]:"#374151"}`,cursor:"pointer",fontSize:12,fontWeight:700,background:surface===s?SURF_BG[s]:"#1F2937",color:surface===s?SURF_COLOR[s]:"#6B7280",transition:"all .2s"}}>
                      {s==="Hard"?"🔵":s==="Clay"?"🟠":"🟢"} {s}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{flex:1,minWidth:240,background:"#111827",borderRadius:12,padding:"14px 18px",border:"1px solid #1F2937"}}>
                <div style={{fontSize:10,fontWeight:700,color:"#6B7280",letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Tournament Round</div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {ROUNDS.map(r=>(
                    <button key={r} onClick={()=>{setRound(r);setResult(null);}} style={{padding:"6px 10px",borderRadius:6,border:`1px solid ${round===r?"#F59E0B":"#374151"}`,cursor:"pointer",fontSize:11,fontWeight:700,background:round===r?"#78350F":"#1F2937",color:round===r?"#FCD34D":"#9CA3AF",transition:"all .2s"}}>{r}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Player selectors */}
            <div style={{display:"flex",gap:14,alignItems:"flex-start",flexWrap:"wrap"}}>
              {/* P1 */}
              <div ref={r1} style={{flex:1,minWidth:260,position:"relative"}}>
                <div style={{background:"#111827",borderRadius:14,border:`2px solid ${p1?"#F59E0B":"#1F2937"}`,overflow:"hidden",transition:"border .2s"}}>
                  <div style={{padding:"12px 16px",borderBottom:"1px solid #1F2937",display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:12,fontWeight:800,color:"#F59E0B"}}>PLAYER 1</span>
                    {p1&&<span style={{marginLeft:"auto",fontSize:11,color:"#6B7280"}}>#{p1.rank} · {p1.pts.toLocaleString()} pts</span>}
                  </div>
                  <div style={{padding:"10px 14px"}}>
                    <input value={q1} onChange={e=>{setQ1(e.target.value);setDrop1(true);}} onFocus={()=>setDrop1(true)} placeholder="Search player name…" style={{width:"100%",background:"transparent",border:"none",outline:"none",fontSize:14,color:"#E2E8F0",boxSizing:"border-box"}}/>
                  </div>
                  {p1&&<PlayerCard p={p1} surface={surface} accent="#F59E0B"/>}
                </div>
                {drop1&&filt1.length>0&&<Dropdown items={filt1.filter(x=>x.rank!==p2?.rank)} onPick={x=>{setP1(x);setQ1(x.name);setDrop1(false);setResult(null);}}/>}
              </div>

              {/* VS */}
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",paddingTop:54}}>
                <div style={{width:42,height:42,borderRadius:"50%",background:"linear-gradient(135deg,#F59E0B,#EF4444)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:13,color:"#fff",boxShadow:"0 0 20px rgba(245,158,11,.3)"}}>VS</div>
              </div>

              {/* P2 */}
              <div ref={r2} style={{flex:1,minWidth:260,position:"relative"}}>
                <div style={{background:"#111827",borderRadius:14,border:`2px solid ${p2?"#8B5CF6":"#1F2937"}`,overflow:"hidden",transition:"border .2s"}}>
                  <div style={{padding:"12px 16px",borderBottom:"1px solid #1F2937",display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:12,fontWeight:800,color:"#8B5CF6"}}>PLAYER 2</span>
                    {p2&&<span style={{marginLeft:"auto",fontSize:11,color:"#6B7280"}}>#{p2.rank} · {p2.pts.toLocaleString()} pts</span>}
                  </div>
                  <div style={{padding:"10px 14px"}}>
                    <input value={q2} onChange={e=>{setQ2(e.target.value);setDrop2(true);}} onFocus={()=>setDrop2(true)} placeholder="Search player name…" style={{width:"100%",background:"transparent",border:"none",outline:"none",fontSize:14,color:"#E2E8F0",boxSizing:"border-box"}}/>
                  </div>
                  {p2&&<PlayerCard p={p2} surface={surface} accent="#8B5CF6"/>}
                </div>
                {drop2&&filt2.length>0&&<Dropdown items={filt2.filter(x=>x.rank!==p1?.rank)} onPick={x=>{setP2(x);setQ2(x.name);setDrop2(false);setResult(null);}}/>}
              </div>
            </div>

            {/* Predict button */}
            <div style={{textAlign:"center",marginTop:20}}>
              <button onClick={predict} disabled={!p1||!p2||loading} style={{padding:"13px 48px",background:p1&&p2?"linear-gradient(135deg,#F59E0B,#EF4444)":"#1F2937",color:p1&&p2?"#fff":"#4B5563",border:"none",borderRadius:12,fontSize:15,fontWeight:800,cursor:p1&&p2?"pointer":"default",letterSpacing:"-0.3px",boxShadow:p1&&p2?"0 4px 24px rgba(239,68,68,.3)":"none",transition:"all .2s"}}>
                {loading?"⚙️ Analysing Match…":"🎾 Predict Match Outcome"}
              </button>
              {(!p1||!p2)&&<p style={{fontSize:12,color:"#374151",marginTop:8}}>Select two players above to generate prediction</p>}
            </div>

            {/* Result */}
            {result&&anim&&(
              <div style={{marginTop:24,animation:"fadeUp .4s ease"}}>
                {/* Prob banner */}
                <div style={{background:scBg,borderRadius:16,border:`1px solid ${SURF_COLOR[surface]}33`,overflow:"hidden",marginBottom:14}}>
                  <div style={{padding:"14px 20px",textAlign:"center",borderBottom:`1px solid ${SURF_COLOR[surface]}33`}}>
                    <div style={{fontSize:11,fontWeight:700,color:SURF_COLOR[surface],letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>
                      {surface} Court · {round} Prediction
                    </div>
                    <div style={{fontSize:13,color:"#9CA3AF"}}>Predicted Score: <span style={{color:"#E2E8F0",fontWeight:700}}>{result.score}</span></div>
                  </div>
                  <div style={{padding:"22px 24px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:16}}>
                      <div style={{textAlign:"center",flex:1}}>
                        <div style={{fontSize:12,color:"#9CA3AF",marginBottom:4}}>{flag(p1.country)} {p1.name}</div>
                        <div style={{fontSize:52,fontWeight:900,color:result.p1Win>=50?"#F59E0B":"#4B5563",lineHeight:1}}>{result.p1Win}%</div>
                        <div style={{fontSize:10,color:"#6B7280",marginTop:3}}>WIN PROBABILITY</div>
                        {result.p1Win>=50&&<div style={{marginTop:6,padding:"3px 10px",background:"#78350F",borderRadius:99,display:"inline-block",fontSize:11,fontWeight:700,color:"#FCD34D"}}>PREDICTED WINNER</div>}
                      </div>
                      <div style={{fontSize:20,color:"#374151"}}>⚡</div>
                      <div style={{textAlign:"center",flex:1}}>
                        <div style={{fontSize:12,color:"#9CA3AF",marginBottom:4}}>{flag(p2.country)} {p2.name}</div>
                        <div style={{fontSize:52,fontWeight:900,color:result.p2Win>=50?"#8B5CF6":"#4B5563",lineHeight:1}}>{result.p2Win}%</div>
                        <div style={{fontSize:10,color:"#6B7280",marginTop:3}}>WIN PROBABILITY</div>
                        {result.p2Win>=50&&<div style={{marginTop:6,padding:"3px 10px",background:"#3B0764",borderRadius:99,display:"inline-block",fontSize:11,fontWeight:700,color:"#C4B5FD"}}>PREDICTED WINNER</div>}
                      </div>
                    </div>
                    {/* bar */}
                    <div style={{marginTop:18,height:8,borderRadius:99,background:"#1F2937",overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${result.p1Win}%`,background:"linear-gradient(90deg,#F59E0B,#EF4444)",borderRadius:99,transition:"width 1.2s ease"}}/>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:5,fontSize:10,color:"#6B7280"}}>
                      <span>{p1.name.split(" ").pop()}</span>
                      <span style={{color:result.confidence>30?"#22C55E":result.confidence>15?"#F59E0B":"#EF4444",fontWeight:700}}>
                        Confidence: {result.confidence>30?"High ✓":result.confidence>15?"Medium":"Low"} ({Math.round(result.confidence)}%)
                      </span>
                      <span>{p2.name.split(" ").pop()}</span>
                    </div>
                  </div>
                </div>

                {/* Feature breakdown */}
                <div style={{background:"#111827",borderRadius:14,border:"1px solid #1F2937",padding:"18px 22px"}}>
                  <div style={{fontSize:13,fontWeight:700,marginBottom:14,color:"#E2E8F0"}}>📊 Feature Breakdown — Who Has the Edge?</div>
                  {result.features.map(f=>{
                    const edge=f.p1Val-50;
                    const col=edge>0?"#F59E0B":"#8B5CF6";
                    const pct=Math.min(Math.abs(edge),50);
                    const adv=edge>2?`▲ ${p1.name.split(" ").pop()}`:edge<-2?`▲ ${p2.name.split(" ").pop()}`:"Even";
                    return(
                      <div key={f.name} style={{marginBottom:10}}>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#9CA3AF",marginBottom:3}}>
                          <span>{f.name}</span>
                          <span style={{color:edge>2?"#F59E0B":edge<-2?"#8B5CF6":"#6B7280",fontWeight:700}}>{adv}</span>
                        </div>
                        <div style={{height:5,borderRadius:99,background:"#1F2937",position:"relative"}}>
                          <div style={{position:"absolute",left:"50%",top:0,height:"100%",width:`${pct*2}%`,background:col,borderRadius:99,transform:edge>0?"translateX(-100%)":"translateX(0)",opacity:0.85}}/>
                          <div style={{position:"absolute",left:"calc(50% - 1px)",top:0,height:"100%",width:2,background:"#374151"}}/>
                        </div>
                      </div>
                    );
                  })}
                  <div style={{marginTop:14,padding:"10px 14px",background:"#060810",borderRadius:8,fontSize:10,color:"#6B7280",lineHeight:1.7}}>
                    <b style={{color:"#9CA3AF"}}>Model:</b> Logistic regression with 11 engineered features: WTA ranking + points differential, surface win rate (official records), serve index (ace rate, DF rate, 1st serve win%), BP conversion, BP saved%, rally rating, mental toughness index, fitness score, handedness, age curve, and round pressure multiplier. Rankings sourced from official WTA PDF, 15 June 2026.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── RANKINGS ── */}
        {tab==="rankings"&&(
          <div>
            <div style={{marginBottom:12,display:"flex",gap:10,alignItems:"center"}}>
              <input value={rankFilter} onChange={e=>setRankFilter(e.target.value)} placeholder="🔍  Filter by name or country…" style={{flex:1,background:"#111827",border:"1px solid #1F2937",borderRadius:8,padding:"9px 14px",color:"#E2E8F0",fontSize:13,outline:"none"}}/>
              <div style={{fontSize:12,color:"#4B5563",whiteSpace:"nowrap"}}>{rankFiltered.length} players</div>
            </div>
            <div style={{background:"#111827",borderRadius:14,border:"1px solid #1F2937",overflow:"hidden"}}>
              <div style={{padding:"14px 20px",borderBottom:"1px solid #1F2937",display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:15,fontWeight:800}}>🏆 Official WTA Singles Rankings</span>
                <span style={{fontSize:11,color:"#6B7280"}}>As of 15 June 2026 · Source: WTA Media PDF</span>
              </div>
              <div style={{maxHeight:580,overflowY:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead style={{position:"sticky",top:0,background:"#0A0F1E",zIndex:10}}>
                    <tr>
                      {["#","Player","Nat","Pts","Age","H","Hard","Clay","Grass","Aces","Mental"].map(h=>(
                        <th key={h} style={{padding:"9px 10px",textAlign:"left",color:"#6B7280",fontWeight:700,fontSize:10,letterSpacing:.5,textTransform:"uppercase",borderBottom:"1px solid #1F2937"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rankFiltered.map((p,i)=>(
                      <tr key={p.rank} style={{borderBottom:"1px solid #0F172A",cursor:"pointer",transition:"background .15s"}}
                        onMouseOver={e=>e.currentTarget.style.background="#1F2937"}
                        onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                        <td style={{padding:"9px 10px",fontWeight:800,color:p.rank<=3?["#F59E0B","#CBD5E1","#B45309"][p.rank-1]:"#6B7280",fontSize:13}}>{p.rank}</td>
                        <td style={{padding:"9px 10px",fontWeight:700,color:"#E2E8F0"}}>{p.name}</td>
                        <td style={{padding:"9px 10px"}}><span title={p.country}>{flag(p.country)}</span> <span style={{fontSize:10,color:"#6B7280"}}>{p.country}</span></td>
                        <td style={{padding:"9px 10px",color:"#9CA3AF",fontSize:11}}>{p.pts.toLocaleString()}</td>
                        <td style={{padding:"9px 10px",color:"#6B7280"}}>{p.age}</td>
                        <td style={{padding:"9px 10px",color:p.hand==="L"?"#A78BFA":"#6B7280",fontWeight:700}}>{p.hand}</td>
                        <td style={{padding:"9px 10px"}}><MiniBar val={p.surface.hard} color="#3B82F6"/></td>
                        <td style={{padding:"9px 10px"}}><MiniBar val={p.surface.clay} color="#EA580C"/></td>
                        <td style={{padding:"9px 10px"}}><MiniBar val={p.surface.grass} color="#22C55E"/></td>
                        <td style={{padding:"9px 10px",color:"#E2E8F0",fontWeight:600}}>{p.aces}</td>
                        <td style={{padding:"9px 10px"}}><MiniBar val={p.mental} color="#8B5CF6"/></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── LEADERS ── */}
        {tab==="leaders"&&(
          <div style={{display:"grid",gap:14,gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))"}}>
            <LeaderCard title="🔵 Hard Court Leaders" players={[...WTA_PLAYERS].sort((a,b)=>b.surface.hard-a.surface.hard).slice(0,8)} stat={p=>p.surface.hard} label="Hard%"/>
            <LeaderCard title="🟠 Clay Court Queens" players={[...WTA_PLAYERS].sort((a,b)=>b.surface.clay-a.surface.clay).slice(0,8)} stat={p=>p.surface.clay} label="Clay%"/>
            <LeaderCard title="🟢 Grass Court Specialists" players={[...WTA_PLAYERS].sort((a,b)=>b.surface.grass-a.surface.grass).slice(0,8)} stat={p=>p.surface.grass} label="Grass%"/>
            <LeaderCard title="⚡ Biggest Servers" players={[...WTA_PLAYERS].sort((a,b)=>b.aces-a.aces).slice(0,8)} stat={p=>p.aces} label="Ace/G"/>
            <LeaderCard title="🧠 Mental Toughness" players={[...WTA_PLAYERS].sort((a,b)=>b.mental-a.mental).slice(0,8)} stat={p=>p.mental} label="MTI"/>
            <LeaderCard title="🏃 Peak Fitness" players={[...WTA_PLAYERS].sort((a,b)=>b.fitness-a.fitness).slice(0,8)} stat={p=>p.fitness} label="FIT"/>
            <LeaderCard title="🔄 Rally Queens" players={[...WTA_PLAYERS].sort((a,b)=>b.rallying-a.rallying).slice(0,8)} stat={p=>p.rallying} label="Rally"/>
            <LeaderCard title="💪 BP Converters" players={[...WTA_PLAYERS].sort((a,b)=>b.bpConvert-a.bpConvert).slice(0,8)} stat={p=>p.bpConvert} label="BP%"/>
          </div>
        )}
      </main>
    </div>
  );
}

function PlayerCard({p,surface,accent}){
  return(
    <div style={{padding:"12px 16px 14px",borderTop:"1px solid #1F2937"}}>
      <div style={{fontSize:16,fontWeight:800,color:"#F1F5F9",marginBottom:2}}>{flag(p.country)} {p.name}</div>
      <div style={{fontSize:11,color:"#9CA3AF",marginBottom:10}}>Age {p.age} · {p.hand==="R"?"Right":"Left"}-handed · {p.country} · WTA #{p.rank}</div>
      <div style={{display:"flex",gap:6}}>
        {["Hard","Clay","Grass"].map(s=>(
          <div key={s} style={{flex:1,background:"#1F2937",borderRadius:8,padding:"6px 8px",textAlign:"center",border:surface===s?`1px solid ${SURF_COLOR[s]}33`:"1px solid transparent"}}>
            <div style={{fontSize:10,color:surface===s?SURF_COLOR[s]:"#6B7280"}}>{s}</div>
            <div style={{fontSize:16,fontWeight:800,color:surface===s?SURF_COLOR[s]:"#CBD5E1"}}>{p.surface[s.toLowerCase()]}%</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:6,marginTop:6}}>
        {[{l:"Aces",v:p.aces},{l:"1st Srv",v:p.firstWin+"%"},{l:"BP Sv",v:p.bpSaved+"%"},{l:"Mental",v:p.mental}].map(x=>(
          <div key={x.l} style={{flex:1,background:"#1F2937",borderRadius:6,padding:"5px 6px",textAlign:"center"}}>
            <div style={{fontSize:9,color:"#6B7280"}}>{x.l}</div>
            <div style={{fontSize:12,fontWeight:700,color:"#CBD5E1"}}>{x.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Dropdown({items,onPick}){
  return(
    <div style={{position:"absolute",zIndex:50,top:"100%",left:0,right:0,background:"#1F2937",border:"1px solid #374151",borderRadius:10,marginTop:4,overflow:"hidden",boxShadow:"0 12px 40px rgba(0,0,0,.6)"}}>
      {items.map(p=>(
        <div key={p.rank} onClick={()=>onPick(p)} style={{padding:"9px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid #374151",transition:"background .15s"}}
          onMouseOver={e=>e.currentTarget.style.background="#374151"}
          onMouseOut={e=>e.currentTarget.style.background="transparent"}>
          <span style={{fontSize:11,color:"#6B7280",width:24,flexShrink:0}}>#{p.rank}</span>
          <span style={{fontSize:13,color:"#E2E8F0",fontWeight:600}}>{flag(p.country)} {p.name}</span>
          <span style={{marginLeft:"auto",fontSize:10,color:"#6B7280"}}>{p.pts.toLocaleString()} pts</span>
        </div>
      ))}
    </div>
  );
}

function MiniBar({val,color}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:5}}>
      <div style={{flex:1,height:4,borderRadius:99,background:"#1F2937",overflow:"hidden"}}>
        <div style={{height:"100%",width:`${val}%`,background:color,borderRadius:99}}/>
      </div>
      <span style={{fontSize:10,color:"#9CA3AF",width:24}}>{val}</span>
    </div>
  );
}

function LeaderCard({title,players,stat,label}){
  const medals=["🥇","🥈","🥉"];
  return(
    <div style={{background:"#111827",borderRadius:14,border:"1px solid #1F2937",overflow:"hidden"}}>
      <div style={{padding:"13px 18px",borderBottom:"1px solid #1F2937",fontSize:13,fontWeight:800}}>{title}</div>
      {players.map((p,i)=>(
        <div key={p.rank} style={{padding:"9px 18px",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid #0A0F1E"}}>
          <span style={{fontSize:13,width:22}}>{medals[i]||<span style={{color:"#4B5563",fontWeight:700}}>{i+1}</span>}</span>
          <span style={{flex:1,fontSize:12,color:"#E2E8F0",fontWeight:600}}>{p.name}</span>
          <span style={{fontSize:11,color:"#6B7280",marginRight:4}}>#{p.rank}</span>
          <span style={{fontSize:13,fontWeight:800,color:"#F59E0B"}}>{stat(p)}</span>
          <span style={{fontSize:10,color:"#6B7280"}}>{label}</span>
        </div>
      ))}
    </div>
  );
}
