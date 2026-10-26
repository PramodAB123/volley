// Translations. English is the source text; each entry lists the same text in
// Spanish, Portuguese (Brazil), French, German and Turkish, in that order.
// The language comes from the player's choice in Settings, then the
// CrazyGames locale, then the browser language, then English.
(function () {
  SR.LANGS = { en: 'English', es: 'Español', pt: 'Português', fr: 'Français', de: 'Deutsch', tr: 'Türkçe' };
  var ORDER = ['es', 'pt', 'fr', 'de', 'tr'];

  var S = {
    // ---- menu and screens (static page text) ----
    'Coach a six-player volleyball team: call the serve, the set and the spike.': [
      'Dirige un equipo de vóley de seis: decide el saque, la colocación y el remate.',
      'Comande um time de vôlei de seis: escolha o saque, o levantamento e a cortada.',
      'Dirige une équipe de volley à six : choisis le service, la passe et le smash.',
      'Coache ein Volleyballteam mit sechs Spielern: Du entscheidest Aufschlag, Zuspiel und Angriff.',
      'Altı kişilik bir voleybol takımını yönet: servisi, pası ve smacı sen seç.'],
    'Quick match': ['Partido rápido', 'Partida rápida', 'Match rapide', 'Schnelles Spiel', 'Hızlı maç'],
    'Play online': ['Jugar en línea', 'Jogar online', 'Jouer en ligne', 'Online spielen', 'Çevrimiçi oyna'],
    'League': ['Liga', 'Liga', 'Championnat', 'Liga', 'Lig'],
    'Tournament': ['Torneo', 'Torneio', 'Tournoi', 'Turnier', 'Turnuva'],
    'Shop': ['Tienda', 'Loja', 'Boutique', 'Shop', 'Mağaza'],
    'Stats': ['Estadísticas', 'Estatísticas', 'Statistiques', 'Statistik', 'İstatistikler'],
    'Settings': ['Ajustes', 'Configurações', 'Paramètres', 'Einstellungen', 'Ayarlar'],
    'How to play': ['Cómo jugar', 'Como jogar', 'Comment jouer', 'So wird gespielt', 'Nasıl oynanır'],
    'Choose your team': ['Elige tu equipo', 'Escolha seu time', 'Choisis ton équipe', 'Wähle dein Team', 'Takımını seç'],
    'Choose your opponent': ['Elige a tu rival', 'Escolha seu adversário', 'Choisis ton adversaire', 'Wähle deinen Gegner', 'Rakibini seç'],
    'League: choose your team': ['Liga: elige tu equipo', 'Liga: escolha seu time', 'Championnat : choisis ton équipe', 'Liga: Wähle dein Team', 'Lig: takımını seç'],
    'Tournament: choose your team': ['Torneo: elige tu equipo', 'Torneio: escolha seu time', 'Tournoi : choisis ton équipe', 'Turnier: Wähle dein Team', 'Turnuva: takımını seç'],
    'Back': ['Atrás', 'Voltar', 'Retour', 'Zurück', 'Geri'],
    'Menu': ['Menú', 'Menu', 'Menu', 'Menü', 'Menü'],
    'Play next match': ['Jugar siguiente partido', 'Jogar próxima partida', 'Jouer le match suivant', 'Nächstes Spiel', 'Sonraki maçı oyna'],
    'New season': ['Nueva temporada', 'Nova temporada', 'Nouvelle saison', 'Neue Saison', 'Yeni sezon'],
    'Abandon league': ['Abandonar liga', 'Abandonar liga', 'Abandonner le championnat', 'Liga abbrechen', 'Ligden çık'],
    'Play match': ['Jugar partido', 'Jogar partida', 'Jouer le match', 'Spiel starten', 'Maçı oyna'],
    'New tournament': ['Nuevo torneo', 'Novo torneio', 'Nouveau tournoi', 'Neues Turnier', 'Yeni turnuva'],
    'Abandon tournament': ['Abandonar torneo', 'Abandonar torneio', 'Abandonner le tournoi', 'Turnier abbrechen', 'Turnuvadan çık'],
    'Win matches to earn stars, then unlock new looks.': [
      'Gana partidos para conseguir estrellas y desbloquea nuevos estilos.',
      'Vença partidas para ganhar estrelas e desbloquear novos visuais.',
      'Gagne des matchs pour obtenir des étoiles, puis débloque de nouveaux styles.',
      'Gewinne Spiele, sammle Sterne und schalte neue Looks frei.',
      'Maç kazanarak yıldız topla, sonra yeni görünümlerin kilidini aç.'],
    'Balls': ['Balones', 'Bolas', 'Ballons', 'Bälle', 'Toplar'],
    'Courts': ['Canchas', 'Quadras', 'Terrains', 'Felder', 'Sahalar'],
    'Career stats': ['Estadísticas de carrera', 'Estatísticas da carreira', 'Statistiques de carrière', 'Karrierestatistik', 'Kariyer istatistikleri'],
    'Reset progress': ['Borrar progreso', 'Apagar progresso', 'Réinitialiser la progression', 'Fortschritt zurücksetzen', 'İlerlemeyi sıfırla'],
    'Click again to erase everything': ['Pulsa otra vez para borrarlo todo', 'Clique de novo para apagar tudo', 'Clique encore pour tout effacer', 'Nochmal klicken, um alles zu löschen', 'Her şeyi silmek için tekrar tıkla'],
    'Match length': ['Duración del partido', 'Duração da partida', 'Durée du match', 'Spiellänge', 'Maç uzunluğu'],
    'Difficulty': ['Dificultad', 'Dificuldade', 'Difficulté', 'Schwierigkeit', 'Zorluk'],
    'Sound effects': ['Efectos de sonido', 'Efeitos sonoros', 'Effets sonores', 'Soundeffekte', 'Ses efektleri'],
    'Language': ['Idioma', 'Idioma', 'Langue', 'Sprache', 'Dil'],
    'Automatic': ['Automático', 'Automático', 'Automatique', 'Automatisch', 'Otomatik'],
    'Sound is muted by your CrazyGames settings.': [
      'El sonido está silenciado por tus ajustes de CrazyGames.',
      'O som está desativado nas suas configurações do CrazyGames.',
      'Le son est coupé par tes paramètres CrazyGames.',
      'Der Ton ist in deinen CrazyGames-Einstellungen stummgeschaltet.',
      'Ses, CrazyGames ayarların tarafından kapatıldı.'],
    'Victory!': ['¡Victoria!', 'Vitória!', 'Victoire !', 'Sieg!', 'Galibiyet!'],
    'Defeat': ['Derrota', 'Derrota', 'Défaite', 'Niederlage', 'Mağlubiyet'],
    'Continue': ['Continuar', 'Continuar', 'Continuer', 'Weiter', 'Devam'],
    'Paused': ['En pausa', 'Pausado', 'Pause', 'Pausiert', 'Duraklatıldı'],
    'Resume': ['Reanudar', 'Continuar', 'Reprendre', 'Fortsetzen', 'Devam et'],
    'Quit match': ['Salir del partido', 'Sair da partida', 'Quitter le match', 'Spiel beenden', 'Maçtan çık'],
    'Pause': ['Pausa', 'Pausar', 'Pause', 'Pause', 'Duraklat'],
    'Volleyball court': ['Cancha de vóley', 'Quadra de vôlei', 'Terrain de volley', 'Volleyballfeld', 'Voleybol sahası'],

    // ---- how to play (HTML) ----
    'help.intro': [
      'Diriges al equipo de la mitad cercana. Tus jugadores se mueven solos; tú tomas las tres decisiones de cada jugada.',
      'Você comanda o time da metade mais próxima. Os jogadores se movem sozinhos; você faz as três escolhas de cada rali.',
      'Tu diriges l\'équipe de la moitié la plus proche. Tes joueurs se déplacent seuls ; tu prends les trois décisions de chaque échange.',
      'Du coachst das Team in der vorderen Hälfte. Deine Spieler laufen von selbst; du triffst die drei Entscheidungen jedes Ballwechsels.',
      'Yakın yarı sahadaki takımı yönetirsin. Oyuncuların kendi kendine hareket eder; her ralliyi belirleyen üç kararı sen verirsin.'],
    'help.serve': [
      '<b>Saque.</b> Mueve el puntero sobre la cancha rival para apuntar y haz clic o toca (o pulsa Espacio). La barra de potencia sube y baja: un saque más fuerte es más difícil de recibir, pero menos preciso.',
      '<b>Saque.</b> Mova o ponteiro sobre a quadra adversária para mirar e clique ou toque (ou aperte Espaço). A barra de força sobe e desce: um saque mais forte é mais difícil de receber, mas menos preciso.',
      '<b>Service.</b> Place le pointeur sur le terrain adverse pour viser, puis clique ou touche (ou appuie sur Espace). La jauge de puissance monte et descend : un service plus fort est plus dur à réceptionner, mais moins précis.',
      '<b>Aufschlag.</b> Ziele mit dem Zeiger auf das gegnerische Feld und klicke oder tippe (oder drücke die Leertaste). Die Kraftanzeige schwingt auf und ab: Ein härterer Aufschlag ist schwerer anzunehmen, aber ungenauer.',
      '<b>Servis.</b> Nişan almak için imleci rakip sahaya getir, sonra tıkla veya dokun (ya da Boşluk tuşuna bas). Güç çubuğu inip çıkar: sert servis zor karşılanır ama daha az isabetlidir.'],
    'help.set': [
      '<b>Colocación.</b> Cuando tu equipo recibe, aparecen números sobre tus atacantes de la red. Haz clic en uno, o pulsa 1 a 3, para elegir quién recibe el balón. Si no eliges, decide el colocador.',
      '<b>Levantamento.</b> Quando seu time recebe, aparecem números sobre os atacantes da rede. Clique em um, ou aperte 1 a 3, para escolher quem recebe a bola. Se não escolher, o levantador decide.',
      '<b>Passe.</b> Quand ton équipe réceptionne, des numéros apparaissent au-dessus de tes attaquants au filet. Clique sur l\'un d\'eux, ou appuie sur 1 à 3, pour choisir qui reçoit le ballon. Sinon, le passeur décide.',
      '<b>Zuspiel.</b> Wenn dein Team annimmt, erscheinen Nummern über deinen Angreifern am Netz. Klicke auf einen oder drücke 1 bis 3, um zu wählen, wer den Ball bekommt. Sonst entscheidet der Zuspieler.',
      '<b>Pas.</b> Takımın topu karşıladığında ön hattaki hücumcuların üstünde numaralar belirir. Topu kimin alacağını seçmek için birine tıkla ya da 1 ile 3 arasına bas. Seçmezsen pasör karar verir.'],
    'help.attack': [
      '<b>Ataque.</b> Mientras el balón está en el aire, elige rápido un golpe con los botones o las teclas 1 a 6 y haz clic donde debe caer: <b>Potencia</b> es el más rápido; <b>Línea</b> y <b>Diagonal</b> apuntan solos por la banda o cruzado; <b>Globo</b> es un golpe lento y alto por encima del bloqueo; <b>Finta</b> lo deja caer justo tras la red; <b>Rebote</b> golpea las manos del bloqueo para mandarlo fuera. Si no eliges un punto, tu atacante falla y el punto es para el rival. Apuntar justo a las líneas es arriesgado.',
      '<b>Ataque.</b> Enquanto a bola está no ar, escolha rápido um golpe com os botões ou as teclas 1 a 6 e clique onde ela deve cair: <b>Força</b> é o mais rápido; <b>Paralela</b> e <b>Diagonal</b> miram sozinhos pela lateral ou cruzado; <b>Meia-força</b> é um golpe lento e alto por cima do bloqueio; <b>Largada</b> deixa a bola logo atrás da rede; <b>Explorar</b> bate nas mãos do bloqueio para mandar a bola para fora. Se não escolher um ponto, seu atacante erra e o ponto vai para o adversário. Mirar bem nas linhas é arriscado.',
      '<b>Attaque.</b> Pendant que la passe est en l\'air, choisis vite un coup avec les boutons ou les touches 1 à 6, puis clique où le ballon doit tomber : <b>Puissance</b> est le plus rapide ; <b>Ligne</b> et <b>Diagonale</b> visent seuls le long de la ligne ou en travers ; <b>Lob</b> est un coup lent et haut par-dessus le contre ; <b>Feinte</b> le dépose juste derrière le filet ; <b>Bloc-out</b> frappe les mains du contre pour envoyer le ballon dehors. Sans point visé, ton attaquant rate et le point va à l\'adversaire. Viser pile sur les lignes est risqué.',
      '<b>Angriff.</b> Während das Zuspiel in der Luft ist, wähle schnell einen Schlag mit den Knöpfen oder den Tasten 1 bis 6 und klicke, wo der Ball landen soll: <b>Wucht</b> ist am schnellsten; <b>Linie</b> und <b>Diagonal</b> zielen selbst entlang der Seitenlinie oder quer; <b>Lob</b> ist ein langsamer, hoher Ball über den Block; <b>Leger</b> legt ihn knapp hinters Netz; <b>Blockout</b> schlägt an die Hände des Blocks, damit der Ball ins Aus geht. Wählst du keinen Punkt, verfehlt dein Angreifer und der Punkt geht an den Gegner. Genau auf die Linien zu zielen ist riskant.',
      '<b>Hücum.</b> Pas havadayken düğmelerle ya da 1 ile 6 arası tuşlarla hızlıca bir vuruş seç, sonra topun düşeceği yere tıkla: <b>Güçlü</b> en hızlısıdır; <b>Çizgi</b> ve <b>Çapraz</b> kendiliğinden kenar çizgisine ya da çapraza nişan alır; <b>Yumuşak</b> bloğun üstünden boşluğa giden yavaş, yüksek bir vuruştur; <b>Plase</b> topu filenin hemen arkasına bırakır; <b>Blok-aut</b> topu blokçuların ellerinden dışarı çıkarır. Bir nokta seçmezsen smaççın ıskalar ve sayı rakibe gider. Tam çizgilere nişan almak risklidir.'],
    'help.online': [
      '<b>En línea.</b> Elige Jugar en línea, crea una sala y envía el código o el enlace a un amigo. Cada uno decide por su equipo y ambos veis la cancha desde vuestro lado. Si se corta la conexión, el juego espera hasta 30 segundos.',
      '<b>Online.</b> Escolha Jogar online, crie uma sala e envie o código ou o link para um amigo. Cada um decide pelo próprio time e os dois veem a quadra do próprio lado. Se a conexão cair, o jogo espera até 30 segundos.',
      '<b>En ligne.</b> Choisis Jouer en ligne, crée un salon et envoie le code ou le lien à un ami. Chacun décide pour son équipe et voit le terrain de son côté. Si la connexion coupe, le jeu attend jusqu\'à 30 secondes.',
      '<b>Online.</b> Wähle Online spielen, erstelle einen Raum und schicke einem Freund den Code oder Link. Jeder entscheidet für sein eigenes Team und sieht das Feld von seiner Seite. Bricht die Verbindung ab, wartet das Spiel bis zu 30 Sekunden.',
      '<b>Çevrimiçi.</b> Çevrimiçi oyna\'yı seç, bir oda kur ve kodu ya da bağlantıyı bir arkadaşına gönder. Herkes kendi takımı için karar verir ve sahayı kendi tarafından görür. Bağlantı koparsa oyun 30 saniyeye kadar bekler.'],
    'help.block': [
      '<b>Bloqueo.</b> Cuando el rival recibe, decide tu bloqueo con los botones o las teclas 1 a 4. Elige Izquierda, Centro o Derecha para juntar a los tres bloqueadores allí antes de la colocación (un gran bloqueo si aciertas, la red abierta si no), o elige Leer para reaccionar con dos bloqueadores.',
      '<b>Bloqueio.</b> Quando o adversário recebe, escolha seu bloqueio com os botões ou as teclas 1 a 4. Escolha Esquerda, Meio ou Direita para juntar os três bloqueadores ali antes do levantamento (um ótimo bloqueio se acertar, a rede aberta se errar), ou escolha Ler para reagir com dois bloqueadores.',
      '<b>Contre.</b> Quand l\'adversaire réceptionne, annonce ton contre avec les boutons ou les touches 1 à 4. Choisis Gauche, Centre ou Droite pour y placer les trois contreurs avant la passe (un super contre si tu devines juste, un filet ouvert sinon), ou choisis Lire pour réagir à deux contreurs.',
      '<b>Block.</b> Wenn der Gegner annimmt, sage deinen Block mit den Knöpfen oder den Tasten 1 bis 4 an. Wähle Links, Mitte oder Rechts, um alle drei Blocker vor dem Zuspiel dort zu sammeln (ein starker Block, wenn du richtig rätst, ein offenes Netz, wenn nicht), oder wähle Lesen, um mit zwei Blockern zu reagieren.',
      '<b>Blok.</b> Rakip topu karşıladığında bloğunu düğmelerle ya da 1 ile 4 arası tuşlarla seç. Pastan önce üç blokçuyu oraya toplamak için Sol, Orta ya da Sağ\'ı seç (doğru tahminde harika bir blok, yanlışta açık bir file) ya da iki blokçuyla tepki vermek için Oku\'yu seç.'],
    'help.rules': [
      'Puntuación por jugada: gana cada set por dos puntos. Antes del partido elige los puntos por set (5, 11 o 15) y cuántos sets jugar (1, al mejor de 3 o al mejor de 5). Ganar la jugada con saque rival te da el saque y tu equipo rota. Pulsa P o Esc para pausar.',
      'Ponto por rali: vença cada set por dois pontos. Antes da partida escolha os pontos por set (5, 11 ou 15) e quantos sets jogar (1, melhor de 3 ou melhor de 5). Ganhar o rali no saque adversário dá o saque ao seu time, que faz o rodízio. Aperte P ou Esc para pausar.',
      'Chaque échange rapporte un point ; gagne chaque set avec deux points d\'écart. Avant un match, choisis les points par set (5, 11 ou 15) et le nombre de sets (1, au meilleur des 3 ou des 5). Gagner l\'échange sur le service adverse te donne le service et fait tourner ton équipe. Appuie sur P ou Échap pour mettre en pause.',
      'Jeder Ballwechsel zählt; ein Satz wird mit zwei Punkten Vorsprung gewonnen. Wähle vor dem Spiel die Punkte pro Satz (5, 11 oder 15) und die Satzzahl (1, Best of 3 oder Best of 5). Gewinnst du den Ballwechsel bei gegnerischem Aufschlag, bekommst du den Aufschlag und dein Team rotiert. Mit P oder Esc pausieren.',
      'Her ralli sayıdır; her seti iki sayı farkla kazan. Maçtan önce set başına sayıyı (5, 11 veya 15) ve set sayısını (1, 3 setin en iyisi veya 5 setin en iyisi) seç. Rakibin servisinde ralliyi kazanırsan servis sana geçer ve takımın rotasyon yapar. Duraklatmak için P veya Esc\'ye bas.'],
    'help.stars': [
      'Estrellas: 1 por victoria. Título de liga +3, copa del torneo +5. Gástalas en la Tienda.',
      'Estrelas: 1 por vitória. Título da liga +3, taça do torneio +5. Gaste na Loja.',
      'Étoiles : 1 par victoire. Titre de champion +3, coupe du tournoi +5. Dépense-les à la Boutique.',
      'Sterne: 1 pro Sieg. Ligatitel +3, Turnierpokal +5. Gib sie im Shop aus.',
      'Yıldızlar: galibiyet başına 1. Lig şampiyonluğu +3, turnuva kupası +5. Mağazada harca.'],

    // ---- rules picker and formats ----
    'Points per set': ['Puntos por set', 'Pontos por set', 'Points par set', 'Punkte pro Satz', 'Set başına sayı'],
    'Sets': ['Sets', 'Sets', 'Sets', 'Sätze', 'Setler'],
    'Best of {n}': ['Al mejor de {n}', 'Melhor de {n}', 'Au meilleur des {n}', 'Best of {n}', '{n} setin en iyisi'],
    '1 set to {p}': ['1 set a {p}', '1 set de {p}', '1 set en {p}', '1 Satz bis {p}', '{p} sayılık 1 set'],
    'Best of {n}, sets to {p}': ['Al mejor de {n}, sets a {p}', 'Melhor de {n}, sets de {p}', 'Au meilleur des {n}, sets en {p}', 'Best of {n}, Sätze bis {p}', '{n} setin en iyisi, setler {p} sayı'],
    'Easy': ['Fácil', 'Fácil', 'Facile', 'Leicht', 'Kolay'],
    'Normal': ['Normal', 'Normal', 'Normal', 'Normal', 'Normal'],
    'Hard': ['Difícil', 'Difícil', 'Difficile', 'Schwer', 'Zor'],
    'ATK': ['ATQ', 'ATQ', 'ATT', 'ANG', 'HÜC'],
    'BLK': ['BLQ', 'BLQ', 'CTR', 'BLO', 'BLK'],
    'PASS': ['REC', 'REC', 'REC', 'ANN', 'KAR'],
    'SRV': ['SAQ', 'SAQ', 'SRV', 'AUF', 'SRV'],

    // ---- results ----
    'Aces {a} · Kills {k} · Blocks {b} · Errors {e}': [
      'Aces {a} · Remates {k} · Bloqueos {b} · Errores {e}',
      'Aces {a} · Pontos de ataque {k} · Bloqueios {b} · Erros {e}',
      'Aces {a} · Attaques gagnantes {k} · Contres {b} · Fautes {e}',
      'Asse {a} · Angriffspunkte {k} · Blocks {b} · Fehler {e}',
      'As {a} · Smaç sayısı {k} · Blok {b} · Hata {e}'],
    '+{n} star': ['+{n} estrella', '+{n} estrela', '+{n} étoile', '+{n} Stern', '+{n} yıldız'],
    '+{n} stars': ['+{n} estrellas', '+{n} estrelas', '+{n} étoiles', '+{n} Sterne', '+{n} yıldız'],
    'No stars this time': ['Sin estrellas esta vez', 'Nenhuma estrela desta vez', 'Pas d\'étoile cette fois', 'Diesmal keine Sterne', 'Bu sefer yıldız yok'],
    '(online)': ['(en línea)', '(online)', '(en ligne)', '(online)', '(çevrimiçi)'],
    '(vs {name})': ['(contra {name})', '(contra {name})', '(contre {name})', '(gegen {name})', '({name} ile)'],

    // ---- league ----
    'League champions! +{n} bonus stars.': ['¡Campeones de liga! +{n} estrellas extra.', 'Campeões da liga! +{n} estrelas bônus.', 'Champions ! +{n} étoiles bonus.', 'Ligameister! +{n} Bonussterne.', 'Lig şampiyonu! +{n} bonus yıldız.'],
    'League finished. {team} took the title.': ['Liga terminada. {team} se llevó el título.', 'Liga encerrada. {team} ficou com o título.', 'Championnat terminé. {team} remporte le titre.', 'Liga beendet. {team} holt den Titel.', 'Lig bitti. Şampiyon {team}.'],
    'Season complete.': ['Temporada terminada.', 'Temporada concluída.', 'Saison terminée.', 'Saison beendet.', 'Sezon tamamlandı.'],
    'Round {r} of 5: {a} vs {b}': ['Jornada {r} de 5: {a} vs {b}', 'Rodada {r} de 5: {a} x {b}', 'Journée {r} sur 5 : {a} contre {b}', 'Spieltag {r} von 5: {a} gegen {b}', '5 haftadan {r}.: {a} - {b}'],
    'Team': ['Equipo', 'Time', 'Équipe', 'Team', 'Takım'],
    'P': ['PJ', 'J', 'J', 'Sp', 'O'],
    'W': ['G', 'V', 'V', 'S', 'G'],
    'L': ['P', 'D', 'D', 'N', 'M'],
    'Pts': ['Pts', 'Pts', 'Pts', 'Pkt', 'P'],

    // ---- tournament ----
    'Cup winners! +{n} bonus stars.': ['¡Campeones de la copa! +{n} estrellas extra.', 'Campeões da taça! +{n} estrelas bônus.', 'Vainqueurs de la coupe ! +{n} étoiles bonus.', 'Pokalsieger! +{n} Bonussterne.', 'Kupa şampiyonu! +{n} bonus yıldız.'],
    'Runners-up. {team} won the cup.': ['Subcampeones. {team} ganó la copa.', 'Vice-campeões. {team} ganhou a taça.', 'Finalistes. {team} remporte la coupe.', 'Vizemeister. {team} gewinnt den Pokal.', 'İkinci oldunuz. Kupayı {team} kazandı.'],
    'Knocked out. {team} won the cup.': ['Eliminados. {team} ganó la copa.', 'Eliminados. {team} ganhou a taça.', 'Éliminés. {team} remporte la coupe.', 'Ausgeschieden. {team} gewinnt den Pokal.', 'Elendiniz. Kupayı {team} kazandı.'],
    'Quarter-finals': ['Cuartos de final', 'Quartas de final', 'Quarts de finale', 'Viertelfinale', 'Çeyrek final'],
    'Semi-finals': ['Semifinales', 'Semifinais', 'Demi-finales', 'Halbfinale', 'Yarı final'],
    'Final': ['Final', 'Final', 'Finale', 'Finale', 'Final'],
    'To be decided': ['Por decidir', 'A definir', 'À déterminer', 'Noch offen', 'Belli değil'],
    'You won the cup!': ['¡Ganaste la copa!', 'Você ganhou a taça!', 'Tu as gagné la coupe !', 'Du hast den Pokal gewonnen!', 'Kupayı kazandın!'],
    '{team} won the cup.': ['{team} ganó la copa.', '{team} ganhou a taça.', '{team} remporte la coupe.', '{team} gewinnt den Pokal.', 'Kupayı {team} kazandı.'],
    '{round}: {a} vs {b}': ['{round}: {a} vs {b}', '{round}: {a} x {b}', '{round} : {a} contre {b}', '{round}: {a} gegen {b}', '{round}: {a} - {b}'],

    // ---- shop ----
    'Equipped': ['Equipado', 'Equipado', 'Équipé', 'Ausgerüstet', 'Kullanılıyor'],
    'Equip': ['Equipar', 'Equipar', 'Équiper', 'Ausrüsten', 'Kullan'],
    'Classic': ['Clásico', 'Clássica', 'Classique', 'Klassik', 'Klasik'],
    'Sunset': ['Atardecer', 'Pôr do sol', 'Coucher de soleil', 'Abendrot', 'Gün batımı'],
    'Neon': ['Neón', 'Neon', 'Néon', 'Neon', 'Neon'],
    'Mono': ['Mono', 'Mono', 'Mono', 'Mono', 'Mono'],
    'Arena': ['Arena', 'Arena', 'Arène', 'Arena', 'Arena'],
    'Ocean': ['Océano', 'Oceano', 'Océan', 'Ozean', 'Okyanus'],
    'Clay': ['Arcilla', 'Saibro', 'Terre battue', 'Sand', 'Kil'],
    'Night': ['Noche', 'Noite', 'Nuit', 'Nacht', 'Gece'],
    'Watch a video: +{n} ★': ['Mira un vídeo: +{n} ★', 'Assista a um vídeo: +{n} ★', 'Regarde une vidéo : +{n} ★', 'Video ansehen: +{n} ★', 'Video izle: +{n} ★'],
    'Free-star videos are unavailable while an ad blocker is on. You can still earn stars by winning matches.': [
      'Los vídeos de estrellas gratis no están disponibles con un bloqueador de anuncios. Puedes seguir ganando estrellas con victorias.',
      'Os vídeos de estrelas grátis ficam indisponíveis com um bloqueador de anúncios ativo. Você ainda ganha estrelas vencendo partidas.',
      'Les vidéos d\'étoiles gratuites sont indisponibles avec un bloqueur de pub. Tu peux toujours gagner des étoiles en remportant des matchs.',
      'Gratis-Sterne-Videos sind mit Werbeblocker nicht verfügbar. Sterne gibt es weiterhin für Siege.',
      'Reklam engelleyici açıkken ücretsiz yıldız videoları kullanılamaz. Maç kazanarak yine yıldız toplayabilirsin.'],
    'More free stars in {n} min.': ['Más estrellas gratis en {n} min.', 'Mais estrelas grátis em {n} min.', 'Nouvelles étoiles gratuites dans {n} min.', 'Weitere Gratis-Sterne in {n} Min.', '{n} dk sonra yine ücretsiz yıldız.'],
    'Thanks for watching! +{n} stars added.': ['¡Gracias por mirar! +{n} estrellas añadidas.', 'Obrigado por assistir! +{n} estrelas adicionadas.', 'Merci d\'avoir regardé ! +{n} étoiles ajoutées.', 'Danke fürs Ansehen! +{n} Sterne erhalten.', 'İzlediğin için teşekkürler! +{n} yıldız eklendi.'],
    'No video available right now. Please try again later.': ['No hay vídeos disponibles ahora. Inténtalo más tarde.', 'Nenhum vídeo disponível agora. Tente mais tarde.', 'Aucune vidéo disponible pour le moment. Réessaie plus tard.', 'Gerade ist kein Video verfügbar. Versuche es später noch einmal.', 'Şu anda video yok. Lütfen daha sonra tekrar dene.'],

    // ---- stats ----
    'Matches': ['Partidos', 'Partidas', 'Matchs', 'Spiele', 'Maçlar'],
    'Wins': ['Victorias', 'Vitórias', 'Victoires', 'Siege', 'Galibiyetler'],
    'Points won': ['Puntos ganados', 'Pontos ganhos', 'Points gagnés', 'Gewonnene Punkte', 'Kazanılan sayılar'],
    'Aces': ['Aces', 'Aces', 'Aces', 'Asse', 'Servis asları'],
    'Kills': ['Remates ganadores', 'Pontos de ataque', 'Attaques gagnantes', 'Angriffspunkte', 'Smaç sayıları'],
    'Blocks': ['Bloqueos', 'Bloqueios', 'Contres', 'Blocks', 'Bloklar'],
    'Stars': ['Estrellas', 'Estrelas', 'Étoiles', 'Sterne', 'Yıldızlar'],

    // ---- on the court ----
    'Tap their court to aim and serve': ['Toca la cancha rival para apuntar y sacar', 'Toque na quadra adversária para mirar e sacar', 'Touche le terrain adverse pour viser et servir', 'Tippe auf das gegnerische Feld, um zu zielen und aufzuschlagen', 'Nişan alıp servis atmak için rakip sahaya dokun'],
    'Aim on their court, click or tap to serve (Space)': ['Apunta a la cancha rival y haz clic o toca para sacar (Espacio)', 'Mire na quadra adversária e clique ou toque para sacar (Espaço)', 'Vise le terrain adverse, clique ou touche pour servir (Espace)', 'Ziele auf das gegnerische Feld, klicke oder tippe für den Aufschlag (Leertaste)', 'Rakip sahaya nişan al, servis için tıkla veya dokun (Boşluk)'],
    'Hitter chosen': ['Atacante elegido', 'Atacante escolhido', 'Attaquant choisi', 'Angreifer gewählt', 'Hücumcu seçildi'],
    'Tap a numbered player to set them': ['Toca un jugador numerado para colocarle', 'Toque em um jogador numerado para levantar para ele', 'Touche un joueur numéroté pour lui faire la passe', 'Tippe auf einen nummerierten Spieler, um ihm zuzuspielen', 'Pas vermek için numaralı bir oyuncuya dokun'],
    'Pick your hitter: click a player or press 1-{n}': ['Elige atacante: haz clic en un jugador o pulsa 1-{n}', 'Escolha o atacante: clique em um jogador ou aperte 1-{n}', 'Choisis l\'attaquant : clique sur un joueur ou appuie sur 1-{n}', 'Wähle den Angreifer: Klicke auf einen Spieler oder drücke 1-{n}', 'Hücumcunu seç: bir oyuncuya tıkla ya da 1-{n} tuşuna bas'],
    '{shot} locked in': ['{shot} elegido', '{shot} escolhido', '{shot} choisi', '{shot} gewählt', '{shot} seçildi'],
    'Pick a shot, then tap where it goes. Line, Cross and Tool aim themselves': ['Elige un golpe y toca dónde va. Línea, Diagonal y Rebote apuntan solos', 'Escolha um golpe e toque onde ele vai. Paralela, Diagonal e Explorar miram sozinhos', 'Choisis un coup, puis touche où il va. Ligne, Diagonale et Bloc-out visent seuls', 'Wähle einen Schlag und tippe, wohin er geht. Linie, Diagonal und Blockout zielen selbst', 'Bir vuruş seç, sonra gideceği yere dokun. Çizgi, Çapraz ve Blok-aut kendisi nişan alır'],
    'Pick a shot (1-6), then click where it goes. Line, Cross and Tool aim themselves': ['Elige un golpe (1-6) y haz clic dónde va. Línea, Diagonal y Rebote apuntan solos', 'Escolha um golpe (1-6) e clique onde ele vai. Paralela, Diagonal e Explorar miram sozinhos', 'Choisis un coup (1-6), puis clique où il va. Ligne, Diagonale et Bloc-out visent seuls', 'Wähle einen Schlag (1-6) und klicke, wohin er geht. Linie, Diagonal und Blockout zielen selbst', 'Bir vuruş seç (1-6), sonra gideceği yere tıkla. Çizgi, Çapraz ve Blok-aut kendisi nişan alır'],
    'Call the block: commit to a side, or Read the set': ['Decide el bloqueo: apuesta por un lado o lee la colocación', 'Escolha o bloqueio: aposte em um lado ou leia o levantamento', 'Annonce le contre : mise sur un côté ou lis la passe', 'Sage den Block an: Lege dich auf eine Seite fest oder lies das Zuspiel', 'Bloğu seç: bir tarafa yüklen ya da pası oku'],
    'Call the block (1-4 or tap a B zone): commit to a side, or Read the set': ['Decide el bloqueo (1-4 o toca una zona B): apuesta por un lado o lee la colocación', 'Escolha o bloqueio (1-4 ou toque numa zona B): aposte em um lado ou leia o levantamento', 'Annonce le contre (1-4 ou touche une zone B) : mise sur un côté ou lis la passe', 'Sage den Block an (1-4 oder tippe auf eine B-Zone): Lege dich fest oder lies das Zuspiel', 'Bloğu seç (1-4 ya da bir B alanına dokun): bir tarafa yüklen ya da pası oku'],
    'Left': ['Izquierda', 'Esquerda', 'Gauche', 'Links', 'Sol'],
    'Middle': ['Centro', 'Meio', 'Centre', 'Mitte', 'Orta'],
    'Right': ['Derecha', 'Direita', 'Droite', 'Rechts', 'Sağ'],
    'Read': ['Leer', 'Ler', 'Lire', 'Lesen', 'Oku'],
    'Power': ['Potencia', 'Força', 'Puissance', 'Wucht', 'Güçlü'],
    'Line': ['Línea', 'Paralela', 'Ligne', 'Linie', 'Çizgi'],
    'Cross': ['Diagonal', 'Diagonal', 'Diagonale', 'Diagonal', 'Çapraz'],
    'Roll': ['Globo', 'Meia-força', 'Lob', 'Lob', 'Yumuşak'],
    'Tip': ['Finta', 'Largada', 'Feinte', 'Leger', 'Plase'],
    'Tool': ['Rebote', 'Explorar', 'Bloc-out', 'Blockout', 'Blok-aut'],
    'SERVE': ['SAQUE', 'SAQUE', 'SERVICE', 'AUFSCHLAG', 'SERVİS'],
    'POWER': ['POTENCIA', 'FORÇA', 'PUISSANCE', 'KRAFT', 'GÜÇ'],
    'SET {n}': ['SET {n}', 'SET {n}', 'SET {n}', 'SATZ {n}', 'SET {n}'],
    'TO {n}': ['A {n}', 'ATÉ {n}', 'EN {n}', 'BIS {n}', '{n} SAYI'],
    'to {n}': ['a {n}', 'até {n}', 'en {n}', 'bis {n}', '{n} sayı'],
    'rot {n}': ['rot {n}', 'rod {n}', 'rot {n}', 'Rot {n}', 'rot {n}'],
    'SET {team}': ['SET {team}', 'SET {team}', 'SET {team}', 'SATZ {team}', 'SET {team}'],
    '{team} WIN': ['GANA {team}', '{team} VENCE', '{team} GAGNE', '{team} SIEGT', '{team} KAZANDI'],
    '{a} vs {b}': ['{a} vs {b}', '{a} x {b}', '{a} contre {b}', '{a} gegen {b}', '{a} - {b}'],
    'ACE!': ['¡ACE!', 'ACE!', 'ACE !', 'ASS!', 'AS!'],
    'KILL!': ['¡REMATE!', 'PONTO!', 'SMASH !', 'TREFFER!', 'SMAÇ!'],
    'BLOCK!': ['¡BLOQUEO!', 'BLOQUEIO!', 'CONTRE !', 'BLOCK!', 'BLOK!'],
    'POINT': ['PUNTO', 'PONTO', 'POINT', 'PUNKT', 'SAYI'],
    'NET': ['RED', 'REDE', 'FILET', 'NETZ', 'FİLE'],
    'OUT': ['FUERA', 'FORA', 'DEHORS', 'AUS', 'AUT'],
    'IN': ['DENTRO', 'DENTRO', 'DEDANS', 'DRIN', 'İÇERİ'],
    'READ IT!': ['¡LEÍDO!', 'LEU!', 'BIEN LU !', 'DURCHSCHAUT!', 'OKUDUN!'],
    'WRONG GUESS': ['FALLASTE', 'ERROU', 'RATÉ', 'FALSCH GERATEN', 'YANLIŞ TAHMİN'],

    // ---- How to play demo (js/demo.js) ----
    'Demo': ['Demo', 'Demo', 'Démo', 'Demo', 'Demo'],
    'Try it': ['Pruébalo', 'Jogar', 'Essaie', 'Probieren', 'Dene'],
    'Watch': ['Ver', 'Assistir', 'Regarder', 'Ansehen', 'İzle'],
    'Play': ['Seguir', 'Continuar', 'Lecture', 'Weiter', 'Oynat'],
    'Next': ['Siguiente', 'Próximo', 'Suivant', 'Weiter', 'İleri'],
    'Play a quick match': [
      'Jugar un partido rápido',
      'Jogar uma partida rápida',
      'Jouer un match rapide',
      'Schnelles Spiel starten',
      'Hızlı maç oyna'],
    'Watch again': ['Ver otra vez', 'Assistir de novo', 'Revoir', 'Nochmal ansehen', 'Tekrar izle'],
    'How to play demo': [
      'Demo de cómo jugar',
      'Demo de como jogar',
      'Démo : comment jouer',
      'Demo: So wird gespielt',
      'Nasıl oynanır demosu'],
    'Demo mode': ['Modo de la demo', 'Modo da demo', 'Mode de la démo', 'Demo-Modus', 'Demo modu'],
    'Close demo': ['Cerrar la demo', 'Fechar a demo', 'Fermer la démo', 'Demo schließen', 'Demoyu kapat'],
    'Skills': ['Habilidades', 'Habilidades', 'Compétences', 'Spielzüge', 'Beceriler'],
    'Previous skill': [
      'Habilidad anterior',
      'Habilidade anterior',
      'Compétence précédente',
      'Vorheriger Spielzug',
      'Önceki beceri'],
    'Replay this skill': [
      'Repetir esta habilidad',
      'Repetir esta habilidade',
      'Rejouer cette compétence',
      'Diesen Spielzug wiederholen',
      'Bu beceriyi tekrarla'],
    'Next skill': ['Siguiente habilidad', 'Próxima habilidade', 'Compétence suivante', 'Nächster Spielzug', 'Sonraki beceri'],
    'Replay': ['Repetir', 'Repetir', 'Rejouer', 'Wiederholen', 'Tekrarla'],
    'PC': ['PC', 'PC', 'PC', 'PC', 'PC'],
    'Phone': ['Móvil', 'Celular', 'Mobile', 'Handy', 'Telefon'],
    'Try the guided demo': [
      'Prueba la demo guiada',
      'Experimente a demo guiada',
      'Essaie la démo guidée',
      'Probier die geführte Demo',
      'Rehberli demoyu dene'],
    'Play a real rally step by step: you make every call, the captions show you how': [
      'Juega una jugada real paso a paso: tú decides cada acción y los textos te explican cómo',
      'Jogue um rali de verdade passo a passo: você faz cada escolha e as legendas mostram como',
      'Joue un vrai échange étape par étape : tu fais chaque choix, les légendes te montrent comment',
      'Spiel einen echten Ballwechsel Schritt für Schritt: Du triffst jede Entscheidung, die Hinweise zeigen dir wie',
      'Gerçek bir ralliyi adım adım oyna: her kararı sen verirsin, açıklamalar nasıl yapılacağını gösterir'],
    'Rather just see it first?': [
      '¿Prefieres verlo primero?',
      'Prefere ver primeiro?',
      'Tu préfères d\'abord regarder ?',
      'Lieber erst zuschauen?',
      'Önce izlemek mi istersin?'],
    'Watch the demo play itself': [
      'Mira la demo jugar sola',
      'Assista à demo jogando sozinha',
      'Regarde la démo jouer toute seule',
      'Sieh der Demo beim Spielen zu',
      'Demonun kendi kendine oynamasını izle'],
    'Your turn: pick {shot}. Tap the {shot} button or press {n}.': [
      'Tu turno: elige {shot}. Toca el botón {shot} o pulsa {n}.',
      'Sua vez: escolha {shot}. Toque no botão {shot} ou aperte {n}.',
      'À toi : choisis {shot}. Touche le bouton {shot} ou appuie sur {n}.',
      'Du bist dran: Wähle {shot}. Tippe auf {shot} oder drücke {n}.',
      'Sıra sende: {shot} seç. {shot} düğmesine dokun ya da {n} tuşuna bas.'],
    'Not that one: this step is about {shot}. Tap {shot} or press {n}.': [
      'Ese no: este paso trata de {shot}. Toca {shot} o pulsa {n}.',
      'Esse não: este passo é sobre {shot}. Toque em {shot} ou aperte {n}.',
      'Pas celui-là : cette étape porte sur {shot}. Touche {shot} ou appuie sur {n}.',
      'Nicht dieser: In diesem Schritt geht es um {shot}. Tippe auf {shot} oder drücke {n}.',
      'O değil: bu adım {shot} ile ilgili. {shot} düğmesine dokun ya da {n} tuşuna bas.'],
    'Coach': ['Entrenador', 'Técnico', 'Coach', 'Trainer', 'Koç'],
    'You are the coach': ['Tú eres el entrenador', 'Você é o técnico', 'Tu es le coach', 'Du bist der Trainer', 'Koç sensin'],
    'You coach the team on the near side of the net. Your players run, pass, set and jump by themselves. You make the four calls that decide each rally: the serve, the set, the attack and the block.': [
      'Diriges al equipo del lado cercano de la red. Tus jugadores corren, reciben, colocan y saltan solos. Tú tomas las cuatro decisiones de cada jugada: el saque, la colocación, el ataque y el bloqueo.',
      'Você comanda o time do lado de cá da rede. Seus jogadores correm, passam, levantam e saltam sozinhos. Você faz as quatro escolhas que decidem cada rali: o saque, o levantamento, o ataque e o bloqueio.',
      'Tu diriges l\'équipe du côté proche du filet. Tes joueurs courent, réceptionnent, passent et sautent tout seuls. Tu fais les quatre choix qui décident chaque échange : le service, la passe, l\'attaque et le contre.',
      'Du trainierst das Team auf der vorderen Netzseite. Deine Spieler laufen, nehmen an, spielen zu und springen von allein. Du triffst die vier Entscheidungen jedes Ballwechsels: Aufschlag, Zuspiel, Angriff und Block.',
      'Filenin yakın tarafındaki takımı sen yönetirsin. Oyuncuların kendi başına koşar, karşılar, pas verir ve zıplar. Her rallinin sonucunu belirleyen dört kararı sen verirsin: servis, pas, hücum ve blok.'],
    'This is your team, on the near side of the net.': [
      'Este es tu equipo, en el lado cercano de la red.',
      'Este é o seu time, do lado de cá da rede.',
      'Voici ton équipe, du côté proche du filet.',
      'Das ist dein Team, auf der vorderen Netzseite.',
      'Bu senin takımın, filenin yakın tarafında.'],
    'This is the other team, across the net.': [
      'Este es el otro equipo, al otro lado de la red.',
      'Este é o outro time, do outro lado da rede.',
      'Voici l\'autre équipe, de l\'autre côté du filet.',
      'Das ist das andere Team, auf der anderen Netzseite.',
      'Bu da rakip takım, filenin karşısında.'],
    'Next: each call, played out in a real rally.': [
      'Ahora: cada decisión, en una jugada real.',
      'A seguir: cada escolha, num rali de verdade.',
      'Ensuite : chaque choix, dans un vrai échange.',
      'Gleich: jede Entscheidung in einem echten Ballwechsel.',
      'Sırada: her karar, gerçek bir rallide.'],
    'Serve': ['Saque', 'Saque', 'Service', 'Aufschlag', 'Servis'],
    'Serve: aim and power': [
      'Saque: dirección y potencia',
      'Saque: mira e força',
      'Service : visée et puissance',
      'Aufschlag: Ziel und Kraft',
      'Servis: nişan ve güç'],
    'Aim anywhere on their court, then serve while the power bar swings. A harder serve is tougher to pass but less accurate. A serve into the gap between two passers can win the point outright.': [
      'Apunta a cualquier parte de su campo y saca mientras oscila la barra de potencia. Un saque más fuerte es más difícil de recibir, pero menos preciso. Un saque al hueco entre dos receptores puede ganar el punto directamente.',
      'Mire em qualquer ponto da quadra deles e saque enquanto a barra de força oscila. Um saque mais forte é mais difícil de passar, mas menos preciso. Um saque no espaço entre dois passadores pode ganhar o ponto direto.',
      'Vise n\'importe où sur leur terrain, puis sers pendant que la barre de puissance oscille. Un service plus fort est plus dur à réceptionner, mais moins précis. Un service entre deux réceptionneurs peut gagner le point directement.',
      'Ziele irgendwo auf ihr Feld und schlag auf, während der Kraftbalken pendelt. Ein härterer Aufschlag ist schwerer anzunehmen, aber ungenauer. Ein Aufschlag in die Lücke zwischen zwei Annahmespielern kann den Punkt direkt holen.',
      'Rakip sahada istediğin yere nişan al, güç çubuğu salınırken servisi at. Daha sert servis zor karşılanır ama daha az isabetlidir. İki karşılayıcının arasındaki boşluğa atılan servis sayıyı doğrudan kazandırabilir.'],
    'Move the mouse to aim, then click or press Space': [
      'Mueve el ratón para apuntar y haz clic o pulsa Espacio',
      'Mova o mouse para mirar e clique ou aperte Espaço',
      'Bouge la souris pour viser, puis clique ou appuie sur Espace',
      'Mit der Maus zielen, dann klicken oder Leertaste drücken',
      'Nişan almak için fareyi oynat, sonra tıkla ya da Boşluk\'a bas'],
    'Tap the spot on their court to serve there': [
      'Toca un punto de su campo para sacar ahí',
      'Toque num ponto da quadra deles para sacar ali',
      'Touche un point de leur terrain pour y servir',
      'Tippe auf eine Stelle in ihrem Feld, um dorthin aufzuschlagen',
      'Servisi atmak için rakip sahada bir noktaya dokun'],
    'Move the pointer over their court. The red ring shows where the serve will go.': [
      'Mueve el puntero sobre su campo. El anillo rojo indica adónde irá el saque.',
      'Mova o ponteiro sobre a quadra deles. O anel vermelho mostra para onde vai o saque.',
      'Déplace le pointeur sur leur terrain. L\'anneau rouge montre où ira le service.',
      'Bewege den Zeiger über ihr Feld. Der rote Ring zeigt, wohin der Aufschlag geht.',
      'İmleci rakip sahanın üzerinde gezdir. Kırmızı halka servisin nereye gideceğini gösterir.'],
    'Your turn: move over their court to aim (the red ring), then click, tap or press Space while the power bar is about two thirds full.': [
      'Tu turno: muévete sobre su campo para apuntar (el anillo rojo) y haz clic, toca o pulsa Espacio cuando la barra de potencia esté a unos dos tercios.',
      'Sua vez: passe sobre a quadra deles para mirar (o anel vermelho) e clique, toque ou aperte Espaço com a barra de força em uns dois terços.',
      'À toi : passe sur leur terrain pour viser (l\'anneau rouge), puis clique, touche ou appuie sur Espace quand la barre de puissance est aux deux tiers environ.',
      'Du bist dran: Ziele über ihrem Feld (der rote Ring), dann klicke, tippe oder drücke die Leertaste, wenn der Kraftbalken etwa zu zwei Dritteln voll ist.',
      'Sıra sende: nişan almak için rakip sahanın üzerine gel (kırmızı halka), güç çubuğu yaklaşık üçte iki doluyken tıkla, dokun ya da Boşluk\'a bas.'],
    'The power bar on the left swings up and down. Serve when it is about two thirds full.': [
      'La barra de potencia de la izquierda sube y baja. Saca cuando esté a unos dos tercios.',
      'A barra de força à esquerda sobe e desce. Saque quando estiver em uns dois terços.',
      'La barre de puissance à gauche monte et descend. Sers quand elle est aux deux tiers environ.',
      'Der Kraftbalken links pendelt auf und ab. Schlag auf, wenn er etwa zu zwei Dritteln voll ist.',
      'Soldaki güç çubuğu inip çıkar. Yaklaşık üçte iki dolduğunda servisi at.'],
    'Ace! The serve dropped in before their passers could reach it.': [
      '¡Ace! El saque cayó antes de que sus receptores llegaran.',
      'Ace! O saque caiu antes que os passadores alcançassem.',
      'Ace ! Le service est tombé avant que leurs réceptionneurs ne l\'atteignent.',
      'Ass! Der Aufschlag landete, bevor ihre Annahme hinkam.',
      'As! Servis, karşılayıcılar yetişemeden yere düştü.'],
    'Set': ['Colocación', 'Levantamento', 'Passe', 'Zuspiel', 'Pas'],
    'Set: pick your hitter': [
      'Colocación: elige a tu atacante',
      'Levantamento: escolha o atacante',
      'Passe : choisis ton attaquant',
      'Zuspiel: Wähle deinen Angreifer',
      'Pas: smaççını seç'],
    'When your team passes, numbers appear over your front-row hitters. Pick one before your setter touches the ball, or the setter decides for you. Then, while the set is in the air, pick a shot and where it lands. Pick no spot and your hitter misses the ball.': [
      'Cuando tu equipo recibe, aparecen números sobre tus atacantes de la primera línea. Elige uno antes de que tu colocador toque el balón, o él decidirá por ti. Luego, con el balón en el aire, elige un golpe y dónde cae. Si no eliges un punto, tu atacante falla el balón.',
      'Quando seu time passa, aparecem números sobre os atacantes da rede. Escolha um antes que o levantador toque na bola, ou ele decide por você. Depois, com a bola no ar, escolha um golpe e onde ele cai. Se não escolher um ponto, seu atacante erra a bola.',
      'Quand ton équipe réceptionne, des numéros apparaissent au-dessus de tes attaquants avant. Choisis-en un avant que ton passeur touche le ballon, sinon il décide pour toi. Puis, pendant que la passe est en l\'air, choisis un coup et où il tombe. Sans point visé, ton attaquant rate le ballon.',
      'Wenn dein Team annimmt, erscheinen Zahlen über deinen Angreifern am Netz. Wähle einen, bevor dein Zuspieler den Ball berührt, sonst entscheidet er. Dann, während das Zuspiel in der Luft ist, wählst du einen Schlag und wohin er geht. Wählst du keinen Punkt, verfehlt dein Angreifer den Ball.',
      'Takımın karşıladığında ön sıradaki smaççılarının üzerinde numaralar çıkar. Pasörün topa dokunmadan birini seç, yoksa pasör senin yerine seçer. Sonra pas havadayken bir vuruş ve topun düşeceği yeri seç. Bir nokta seçmezsen smaççın topu ıskalar.'],
    'Click a player or press 1 to 3': [
      'Haz clic en un jugador o pulsa 1 a 3',
      'Clique num jogador ou aperte 1 a 3',
      'Clique sur un joueur ou appuie sur 1 à 3',
      'Klicke auf einen Spieler oder drücke 1 bis 3',
      'Bir oyuncuya tıkla ya da 1-3\'e bas'],
    'Tap a numbered player': [
      'Toca un jugador con número',
      'Toque num jogador numerado',
      'Touche un joueur numéroté',
      'Tippe auf einen Spieler mit Zahl',
      'Numaralı bir oyuncuya dokun'],
    'They serve. Your players pass on their own, up to your setter.': [
      'Ellos sacan. Tus jugadores reciben solos y la pasan a tu colocador.',
      'Eles sacam. Seus jogadores passam sozinhos para o levantador.',
      'Ils servent. Tes joueurs réceptionnent seuls, vers ton passeur.',
      'Sie schlagen auf. Deine Spieler nehmen von allein an, hoch zum Zuspieler.',
      'Onlar servis atıyor. Oyuncuların topu kendi başına pasöre karşılar.'],
    'Numbers pop up over your hitters. Pick number 1, your left-side hitter.': [
      'Aparecen números sobre tus atacantes. Elige el 1, tu atacante de la izquierda.',
      'Aparecem números sobre os atacantes. Escolha o 1, seu atacante da esquerda.',
      'Des numéros apparaissent au-dessus de tes attaquants. Choisis le 1, ton attaquant à gauche.',
      'Über deinen Angreifern erscheinen Zahlen. Wähle die 1, deinen Angreifer links.',
      'Smaççılarının üzerinde numaralar belirdi. 1 numarayı, soldaki smaççını seç.'],
    'Your turn: numbers pop up over your hitters. Tap any of them (or press 1, 2 or 3) to choose who gets the set.': [
      'Tu turno: aparecen números sobre tus atacantes. Toca cualquiera (o pulsa 1, 2 o 3) para elegir quién recibe la colocación.',
      'Sua vez: aparecem números sobre os atacantes. Toque em qualquer um (ou aperte 1, 2 ou 3) para escolher quem recebe o levantamento.',
      'À toi : des numéros apparaissent au-dessus de tes attaquants. Touche-en un (ou appuie sur 1, 2 ou 3) pour choisir qui reçoit la passe.',
      'Du bist dran: Über deinen Angreifern erscheinen Zahlen. Tippe einen an (oder drücke 1, 2 oder 3), um zu wählen, wer das Zuspiel bekommt.',
      'Sıra sende: smaççılarının üzerinde numaralar belirdi. Pası kimin alacağını seçmek için birine dokun (ya da 1, 2 veya 3\'e bas).'],
    'The set is up. Now pick a shot: Power is the fastest, hardest hit.': [
      'La colocación está en el aire. Ahora elige un golpe: Potencia es el más rápido y fuerte.',
      'O levantamento está no ar. Agora escolha um golpe: Força é o mais rápido e forte.',
      'La passe est en l\'air. Choisis un coup : Puissance est le plus rapide et le plus fort.',
      'Das Zuspiel ist in der Luft. Wähle jetzt einen Schlag: Wucht ist der schnellste, härteste.',
      'Pas havada. Şimdi bir vuruş seç: Güçlü en hızlı ve en sert vuruştur.'],
    'Your turn: the set is up. Pick Power, the fastest, hardest hit (tap Power or press 1).': [
      'Tu turno: la colocación está en el aire. Elige Potencia, el golpe más rápido y fuerte (toca Potencia o pulsa 1).',
      'Sua vez: o levantamento está no ar. Escolha Força, o golpe mais rápido e forte (toque em Força ou aperte 1).',
      'À toi : la passe est en l\'air. Choisis Puissance, le coup le plus rapide et le plus fort (touche Puissance ou appuie sur 1).',
      'Du bist dran: Das Zuspiel ist in der Luft. Wähle Wucht, den schnellsten, härtesten Schlag (tippe auf Wucht oder drücke 1).',
      'Sıra sende: pas havada. En hızlı ve sert vuruş olan Güçlü\'yü seç (Güçlü\'ye dokun ya da 1\'e bas).'],
    'Tap where it should land: open floor, away from their defenders and off the lines.': [
      'Toca dónde debe caer: suelo libre, lejos de sus defensores y de las líneas.',
      'Toque onde a bola deve cair: chão livre, longe dos defensores e das linhas.',
      'Touche l\'endroit où il doit tomber : un espace libre, loin de leurs défenseurs et des lignes.',
      'Tippe, wo er landen soll: freie Fläche, weg von ihren Abwehrspielern und den Linien.',
      'Topun düşeceği yere dokun: boş bir alan, savunmacılardan ve çizgilerden uzak.'],
    'Now tap where it should land on their court: open floor, away from their defenders.': [
      'Ahora toca dónde debe caer en su campo: suelo libre, lejos de sus defensores.',
      'Agora toque onde a bola deve cair na quadra deles: chão livre, longe dos defensores.',
      'Maintenant, touche l\'endroit où il doit tomber sur leur terrain : un espace libre, loin de leurs défenseurs.',
      'Tippe jetzt, wo er in ihrem Feld landen soll: freie Fläche, weg von ihren Abwehrspielern.',
      'Şimdi rakip sahada topun düşeceği yere dokun: savunmacılardan uzak boş bir alan.'],
    'Kill! A Power spike into open court.': [
      '¡Remate! Un golpe de Potencia a campo libre.',
      'Ponto! Uma cortada de Força na quadra livre.',
      'Smash ! Un coup de Puissance dans l\'espace libre.',
      'Treffer! Ein Wucht-Angriff ins freie Feld.',
      'Smaç! Boş alana Güçlü bir vuruş.'],
    'Shot: Line': ['Golpe: Línea', 'Golpe: Paralela', 'Coup : Ligne', 'Schlag: Linie', 'Vuruş: Çizgi'],
    'Line aims itself straight down the sideline, past the outside edge of the block. Use it when the blockers leave the line open.': [
      'Línea va sola recta por la banda, por fuera del bloqueo. Úsala cuando los bloqueadores dejen la línea libre.',
      'Paralela vai sozinha reto pela lateral, por fora do bloqueio. Use quando os bloqueadores deixarem a linha livre.',
      'Ligne vise toute seule le long de la ligne de côté, à l\'extérieur du contre. Utilise-la quand les contreurs laissent la ligne ouverte.',
      'Linie zielt von selbst gerade die Seitenlinie entlang, außen am Block vorbei. Nutze sie, wenn die Blocker die Linie offen lassen.',
      'Çizgi kendiliğinden yan çizgi boyunca, bloğun dış kenarından geçer. Blokçular çizgiyi boş bıraktığında kullan.'],
    'Press 2 or click Line while the set is up': [
      'Pulsa 2 o haz clic en Línea con el balón en el aire',
      'Aperte 2 ou clique em Paralela com a bola no ar',
      'Appuie sur 2 ou clique sur Ligne pendant la passe',
      'Drücke 2 oder klicke auf Linie, während das Zuspiel in der Luft ist',
      'Pas havadayken 2\'ye bas ya da Çizgi\'ye tıkla'],
    'Tap Line while the set is up': [
      'Toca Línea con el balón en el aire',
      'Toque em Paralela com a bola no ar',
      'Touche Ligne pendant la passe',
      'Tippe auf Linie, während das Zuspiel in der Luft ist',
      'Pas havadayken Çizgi\'ye dokun'],
    'Set your left-side hitter (1).': [
      'Coloca a tu atacante de la izquierda (1).',
      'Levante para o atacante da esquerda (1).',
      'Fais la passe à ton attaquant à gauche (1).',
      'Spiel deinem Angreifer links zu (1).',
      'Soldaki smaççına pas ver (1).'],
    'Your turn: set your left-side hitter (1). Tap the numbered player, or press the number.': [
      'Tu turno: coloca a tu atacante de la izquierda (1). Toca al jugador con número o pulsa el número.',
      'Sua vez: levante para o atacante da esquerda (1). Toque no jogador numerado ou aperte o número.',
      'À toi : fais la passe à ton attaquant à gauche (1). Touche le joueur numéroté ou appuie sur son numéro.',
      'Du bist dran: Spiel deinem Angreifer links zu (1). Tippe auf den Spieler mit Zahl oder drücke die Zahl.',
      'Sıra sende: soldaki smaççına pas ver (1). Numaralı oyuncuya dokun ya da numarasına bas.'],
    'Pick Line. No spot to tap: it aims itself down the sideline.': [
      'Elige Línea. No hay que tocar ningún punto: va sola por la banda.',
      'Escolha Paralela. Não precisa tocar num ponto: ela mira sozinha pela lateral.',
      'Choisis Ligne. Pas de point à toucher : elle vise toute seule le long de la ligne.',
      'Wähle Linie. Keine Stelle antippen: Sie zielt von selbst die Seitenlinie entlang.',
      'Çizgi\'yi seç. Bir yere dokunmana gerek yok: kendiliğinden yan çizgiye gider.'],
    'The ring shows where the shot is going.': [
      'El anillo muestra adónde va el golpe.',
      'O anel mostra para onde vai o golpe.',
      'L\'anneau montre où va le coup.',
      'Der Ring zeigt, wohin der Schlag geht.',
      'Halka vuruşun nereye gittiğini gösterir.'],
    'Straight down the line for the point.': [
      'Recto por la línea para el punto.',
      'Reto na paralela para o ponto.',
      'Droit le long de la ligne pour le point.',
      'Gerade die Linie entlang zum Punkt.',
      'Çizgi boyunca dümdüz, sayı.'],
    'Shot: Cross': ['Golpe: Diagonal', 'Golpe: Diagonal', 'Coup : Diagonale', 'Schlag: Diagonal', 'Vuruş: Çapraz'],
    'Cross aims itself on a sharp diagonal across the court, away from a block that is guarding the line.': [
      'Diagonal va sola en una diagonal cerrada a través del campo, lejos de un bloqueo que cubre la línea.',
      'Diagonal mira sozinha numa diagonal fechada pela quadra, longe de um bloqueio que protege a linha.',
      'Diagonale vise toute seule une diagonale serrée à travers le terrain, loin d\'un contre qui ferme la ligne.',
      'Diagonal zielt von selbst scharf schräg übers Feld, weg von einem Block, der die Linie sichert.',
      'Çapraz kendiliğinden sahayı keskin bir açıyla keser, çizgiyi kapatan bloktan uzaklaşır.'],
    'Press 3 or click Cross while the set is up': [
      'Pulsa 3 o haz clic en Diagonal con el balón en el aire',
      'Aperte 3 ou clique em Diagonal com a bola no ar',
      'Appuie sur 3 ou clique sur Diagonale pendant la passe',
      'Drücke 3 oder klicke auf Diagonal, während das Zuspiel in der Luft ist',
      'Pas havadayken 3\'e bas ya da Çapraz\'a tıkla'],
    'Tap Cross while the set is up': [
      'Toca Diagonal con el balón en el aire',
      'Toque em Diagonal com a bola no ar',
      'Touche Diagonale pendant la passe',
      'Tippe auf Diagonal, während das Zuspiel in der Luft ist',
      'Pas havadayken Çapraz\'a dokun'],
    'Set your right-side hitter (3).': [
      'Coloca a tu atacante de la derecha (3).',
      'Levante para o atacante da direita (3).',
      'Fais la passe à ton attaquant à droite (3).',
      'Spiel deinem Angreifer rechts zu (3).',
      'Sağdaki smaççına pas ver (3).'],
    'Your turn: set your right-side hitter (3). Tap the numbered player, or press the number.': [
      'Tu turno: coloca a tu atacante de la derecha (3). Toca al jugador con número o pulsa el número.',
      'Sua vez: levante para o atacante da direita (3). Toque no jogador numerado ou aperte o número.',
      'À toi : fais la passe à ton attaquant à droite (3). Touche le joueur numéroté ou appuie sur son numéro.',
      'Du bist dran: Spiel deinem Angreifer rechts zu (3). Tippe auf den Spieler mit Zahl oder drücke die Zahl.',
      'Sıra sende: sağdaki smaççına pas ver (3). Numaralı oyuncuya dokun ya da numarasına bas.'],
    'Pick Cross. It angles the ball across the court by itself.': [
      'Elige Diagonal. Cruza el balón por el campo ella sola.',
      'Escolha Diagonal. Ela cruza a bola pela quadra sozinha.',
      'Choisis Diagonale. Elle envoie le ballon en travers du terrain toute seule.',
      'Wähle Diagonal. Er schickt den Ball von selbst schräg übers Feld.',
      'Çapraz\'ı seç. Topu kendiliğinden sahanın çaprazına yollar.'],
    'Watch it cut back across the block.': [
      'Mira cómo cruza por delante del bloqueo.',
      'Veja como ela corta por dentro do bloqueio.',
      'Regarde-le repartir en travers du contre.',
      'Sieh, wie er quer am Block vorbeizieht.',
      'Bloğun önünden çapraz kesişini izle.'],
    'Cross-court kill.': ['Remate cruzado.', 'Ponto na diagonal.', 'Smash en diagonale.', 'Diagonaler Treffer.', 'Çapraz smaç.'],
    'Shot: Roll': ['Golpe: Globo', 'Golpe: Meia-força', 'Coup : Lob', 'Schlag: Lob', 'Vuruş: Yumuşak'],
    'Roll is a slow, high shot that floats over the block and drops into open space. Great when their defenders are playing deep.': [
      'Globo es un golpe lento y alto que pasa por encima del bloqueo y cae en un espacio libre. Ideal cuando sus defensores juegan atrás.',
      'Meia-força é um golpe lento e alto que passa por cima do bloqueio e cai num espaço livre. Ótimo quando os defensores estão no fundo.',
      'Le Lob est un coup lent et haut qui passe au-dessus du contre et retombe dans un espace libre. Idéal quand leurs défenseurs jouent loin.',
      'Lob ist ein langsamer, hoher Schlag, der über den Block segelt und in eine Lücke fällt. Ideal, wenn ihre Abwehr tief steht.',
      'Yumuşak, bloğun üzerinden süzülüp boş alana düşen yavaş ve yüksek bir vuruştur. Savunmacılar geride oynarken çok etkilidir.'],
    'Press 4 or click Roll, then click a spot': [
      'Pulsa 4 o haz clic en Globo y luego en un punto',
      'Aperte 4 ou clique em Meia-força e depois num ponto',
      'Appuie sur 4 ou clique sur Lob, puis clique sur un point',
      'Drücke 4 oder klicke auf Lob, dann auf eine Stelle',
      '4\'e bas ya da Yumuşak\'a tıkla, sonra bir noktaya tıkla'],
    'Tap Roll, then tap a spot': [
      'Toca Globo y luego un punto',
      'Toque em Meia-força e depois num ponto',
      'Touche Lob, puis un point',
      'Tippe auf Lob, dann auf eine Stelle',
      'Yumuşak\'a, sonra bir noktaya dokun'],
    'Set your middle hitter (2) for a quick attack.': [
      'Coloca a tu central (2) para un ataque rápido.',
      'Levante para o central (2) num ataque rápido.',
      'Fais la passe à ton central (2) pour une attaque rapide.',
      'Spiel deinem Mittelangreifer (2) einen schnellen Angriff zu.',
      'Hızlı hücum için ortadaki smaççına pas ver (2).'],
    'Your turn: set your middle hitter (2) for a quick attack. Tap the numbered player, or press the number.': [
      'Tu turno: coloca a tu central (2) para un ataque rápido. Toca al jugador con número o pulsa el número.',
      'Sua vez: levante para o central (2) num ataque rápido. Toque no jogador numerado ou aperte o número.',
      'À toi : fais la passe à ton central (2) pour une attaque rapide. Touche le joueur numéroté ou appuie sur son numéro.',
      'Du bist dran: Spiel deinem Mittelangreifer (2) einen schnellen Angriff zu. Tippe auf den Spieler mit Zahl oder drücke die Zahl.',
      'Sıra sende: hızlı hücum için ortadaki smaççına pas ver (2). Numaralı oyuncuya dokun ya da numarasına bas.'],
    'Pick Roll.': ['Elige Globo.', 'Escolha Meia-força.', 'Choisis Lob.', 'Wähle Lob.', 'Yumuşak\'ı seç.'],
    'Tap the open space between their front and back rows.': [
      'Toca el espacio libre entre su primera y su segunda línea.',
      'Toque no espaço livre entre a rede e o fundo deles.',
      'Touche l\'espace libre entre leurs lignes avant et arrière.',
      'Tippe auf die Lücke zwischen ihrer vorderen und hinteren Reihe.',
      'Ön ve arka sıraları arasındaki boşluğa dokun.'],
    'Now tap open space on their court, between their front and back rows.': [
      'Ahora toca un espacio libre en su campo, entre su primera y su segunda línea.',
      'Agora toque num espaço livre na quadra deles, entre a rede e o fundo.',
      'Maintenant, touche un espace libre sur leur terrain, entre leurs lignes avant et arrière.',
      'Tippe jetzt auf eine Lücke in ihrem Feld, zwischen vorderer und hinterer Reihe.',
      'Şimdi rakip sahada, ön ve arka sıraları arasındaki boşluğa dokun.'],
    'It floats over the block and drops in.': [
      'Pasa por encima del bloqueo y cae dentro.',
      'Passa por cima do bloqueio e cai dentro.',
      'Il passe au-dessus du contre et retombe dedans.',
      'Er segelt über den Block und fällt rein.',
      'Bloğun üzerinden süzülüp içeri düşüyor.'],
    'Shot: Tip': ['Golpe: Finta', 'Golpe: Largada', 'Coup : Feinte', 'Schlag: Leger', 'Vuruş: Plase'],
    'Tip drops the ball just over the net while their defenders are back, waiting for a big spike. Shortcut: hold Shift while you click a spot (or long-press it on a phone) to tip there.': [
      'Finta deja caer el balón justo detrás de la red mientras sus defensores esperan atrás un remate fuerte. Atajo: mantén Mayús al hacer clic en un punto (o mantén pulsado en el móvil) para hacer una finta ahí.',
      'Largada deixa a bola cair logo depois da rede enquanto os defensores esperam uma cortada forte lá atrás. Atalho: segure Shift ao clicar num ponto (ou toque e segure no celular) para largar ali.',
      'La Feinte fait tomber le ballon juste derrière le filet pendant que leurs défenseurs attendent un gros smash au fond. Raccourci : maintiens Maj en cliquant sur un point (ou appui long sur mobile) pour feinter à cet endroit.',
      'Leger lässt den Ball direkt hinters Netz fallen, während ihre Abwehr hinten auf einen harten Angriff wartet. Abkürzung: Halte Umschalt, während du auf eine Stelle klickst (oder drücke am Handy lange darauf), um dorthin zu legen.',
      'Plase, savunmacılar geride sert bir smaç beklerken topu filenin hemen arkasına bırakır. Kısayol: bir noktaya tıklarken Shift\'i basılı tut (telefonda uzun bas), oraya plase yap.'],
    'Press 5, or Shift + click a spot': [
      'Pulsa 5, o Mayús + clic en un punto',
      'Aperte 5, ou Shift + clique num ponto',
      'Appuie sur 5, ou Maj + clic sur un point',
      'Drücke 5 oder Umschalt + Klick auf eine Stelle',
      '5\'e bas ya da Shift + bir noktaya tıkla'],
    'Tap Tip then a spot, or long-press a spot': [
      'Toca Finta y luego un punto, o mantén pulsado un punto',
      'Toque em Largada e depois num ponto, ou toque e segure um ponto',
      'Touche Feinte puis un point, ou fais un appui long sur un point',
      'Tippe auf Leger und dann auf eine Stelle, oder drücke lange auf eine Stelle',
      'Plase\'ye, sonra bir noktaya dokun ya da bir noktaya uzun bas'],
    'Pick Tip.': ['Elige Finta.', 'Escolha Largada.', 'Choisis Feinte.', 'Wähle Leger.', 'Plase\'yi seç.'],
    'Your turn: pick Tip (tap Tip or press 5). Or hold Shift and click a spot, or long-press it on a phone.': [
      'Tu turno: elige Finta (toca Finta o pulsa 5). O mantén Mayús y haz clic en un punto, o mantenlo pulsado en el móvil.',
      'Sua vez: escolha Largada (toque em Largada ou aperte 5). Ou segure Shift e clique num ponto, ou toque e segure no celular.',
      'À toi : choisis Feinte (touche Feinte ou appuie sur 5). Ou maintiens Maj et clique sur un point, ou fais un appui long sur mobile.',
      'Du bist dran: Wähle Leger (tippe auf Leger oder drücke 5). Oder halte Umschalt und klicke auf eine Stelle, oder drücke am Handy lange darauf.',
      'Sıra sende: Plase\'yi seç (Plase\'ye dokun ya da 5\'e bas). Ya da Shift\'i basılı tutup bir noktaya tıkla, telefonda uzun bas.'],
    'Tap just behind their blockers. The blue ring marks a tip.': [
      'Toca justo detrás de sus bloqueadores. El anillo azul indica una finta.',
      'Toque logo atrás dos bloqueadores. O anel azul marca uma largada.',
      'Touche juste derrière leurs contreurs. L\'anneau bleu indique une feinte.',
      'Tippe direkt hinter ihre Blocker. Der blaue Ring zeigt einen Leger.',
      'Blokçularının hemen arkasına dokun. Mavi halka plaseyi gösterir.'],
    'Now tap a spot just behind their blockers.': [
      'Ahora toca un punto justo detrás de sus bloqueadores.',
      'Agora toque num ponto logo atrás dos bloqueadores.',
      'Maintenant, touche un point juste derrière leurs contreurs.',
      'Tippe jetzt auf eine Stelle direkt hinter ihren Blockern.',
      'Şimdi blokçularının hemen arkasında bir noktaya dokun.'],
    'A soft tip behind the block. Nobody home.': [
      'Una finta suave detrás del bloqueo. No hay nadie.',
      'Uma largada suave atrás do bloqueio. Ninguém lá.',
      'Une feinte douce derrière le contre. Personne.',
      'Ein sanfter Leger hinter den Block. Niemand da.',
      'Bloğun arkasına yumuşak bir plase. Kimse yok.'],
    'Shot: Tool': ['Golpe: Rebote', 'Golpe: Explorar', 'Coup : Bloc-out', 'Schlag: Blockout', 'Vuruş: Blok-aut'],
    'Tool hits hard off the blockers\' hands so the ball flies out of bounds. They touched it last, so the point is yours. Use it against a big block.': [
      'Rebote golpea fuerte contra las manos del bloqueo para que el balón salga fuera. Ellos lo tocaron último, así que el punto es tuyo. Úsalo contra un bloqueo grande.',
      'Explorar bate forte nas mãos do bloqueio para a bola sair. Eles tocaram por último, então o ponto é seu. Use contra um bloqueio forte.',
      'Le Bloc-out frappe fort dans les mains du contre pour envoyer le ballon dehors. Ils l\'ont touché en dernier, donc le point est à toi. Utilise-le contre un gros contre.',
      'Blockout schlägt hart an die Hände der Blocker, sodass der Ball ins Aus fliegt. Sie haben ihn zuletzt berührt, also ist der Punkt deiner. Nutze ihn gegen einen starken Block.',
      'Blok-aut, topu blokçuların ellerine sertçe vurup dışarı uçurur. Topa en son onlar dokunduğu için sayı senin olur. Güçlü bir bloğa karşı kullan.'],
    'Press 6 or click Tool while the set is up': [
      'Pulsa 6 o haz clic en Rebote con el balón en el aire',
      'Aperte 6 ou clique em Explorar com a bola no ar',
      'Appuie sur 6 ou clique sur Bloc-out pendant la passe',
      'Drücke 6 oder klicke auf Blockout, während das Zuspiel in der Luft ist',
      'Pas havadayken 6\'ya bas ya da Blok-aut\'a tıkla'],
    'Tap Tool while the set is up': [
      'Toca Rebote con el balón en el aire',
      'Toque em Explorar com a bola no ar',
      'Touche Bloc-out pendant la passe',
      'Tippe auf Blockout, während das Zuspiel in der Luft ist',
      'Pas havadayken Blok-aut\'a dokun'],
    'Pick Tool. It aims at the edge of the block by itself.': [
      'Elige Rebote. Apunta solo al borde del bloqueo.',
      'Escolha Explorar. Mira sozinho na ponta do bloqueio.',
      'Choisis Bloc-out. Il vise tout seul le bord du contre.',
      'Wähle Blockout. Er zielt von selbst auf den Rand des Blocks.',
      'Blok-aut\'u seç. Kendiliğinden bloğun kenarına nişan alır.'],
    'Aiming at their hands, not the floor.': [
      'Apuntando a sus manos, no al suelo.',
      'Mirando nas mãos, não no chão.',
      'On vise leurs mains, pas le sol.',
      'Ziel sind ihre Hände, nicht der Boden.',
      'Hedef yer değil, onların elleri.'],
    'Off the block and out: your point.': [
      'Toca el bloqueo y sale: punto tuyo.',
      'Bate no bloqueio e sai: ponto seu.',
      'Contre touché et dehors : ton point.',
      'Vom Block ins Aus: dein Punkt.',
      'Bloğa değip dışarı: sayı senin.'],
    'Block': ['Bloqueo', 'Bloqueio', 'Contre', 'Block', 'Blok'],
    'Block: commit to a side': [
      'Bloqueo: elige un lado',
      'Bloqueio: escolha um lado',
      'Contre : choisis un côté',
      'Block: Leg dich auf eine Seite fest',
      'Blok: bir tarafa yüklen'],
    'When they pass, call your block before their setter sets. Commit Left, Middle or Right to stack all three blockers there. Guess right and the hitter meets a wall; guess wrong and the net is wide open.': [
      'Cuando ellos reciben, elige tu bloqueo antes de que su colocador coloque. Elige Izquierda, Centro o Derecha para juntar ahí a tus tres bloqueadores. Si aciertas, el atacante choca con un muro; si fallas, la red queda libre.',
      'Quando eles passam, escolha o bloqueio antes que o levantador deles levante. Escolha Esquerda, Meio ou Direita para juntar os três bloqueadores ali. Acerte e o atacante encontra um muro; erre e a rede fica livre.',
      'Quand ils réceptionnent, choisis ton contre avant que leur passeur ne fasse la passe. Choisis Gauche, Centre ou Droite pour y regrouper tes trois contreurs. Bien deviné, l\'attaquant tombe sur un mur ; mal deviné, le filet est grand ouvert.',
      'Wenn sie annehmen, wähle deinen Block, bevor ihr Zuspieler zuspielt. Wähle Links, Mitte oder Rechts, um alle drei Blocker dort zu sammeln. Richtig geraten, trifft der Angreifer auf eine Wand; falsch geraten, ist das Netz weit offen.',
      'Onlar karşıladığında, pasörleri pas vermeden bloğunu seç. Üç blokçunu da oraya toplamak için Sol, Orta ya da Sağ\'ı seç. Doğru tahmin edersen smaççı duvara çarpar; yanlış tahmin edersen file bomboş kalır.'],
    'Press 1 to 3, or click a button or a B zone': [
      'Pulsa 1 a 3, o haz clic en un botón o una zona B',
      'Aperte 1 a 3, ou clique num botão ou numa zona B',
      'Appuie sur 1 à 3, ou clique sur un bouton ou une zone B',
      'Drücke 1 bis 3 oder klicke auf einen Knopf oder eine B-Zone',
      '1-3\'e bas ya da bir düğmeye veya B alanına tıkla'],
    'Tap Left, Middle or Right': [
      'Toca Izquierda, Centro o Derecha',
      'Toque em Esquerda, Meio ou Direita',
      'Touche Gauche, Centre ou Droite',
      'Tippe auf Links, Mitte oder Rechts',
      'Sol, Orta ya da Sağ\'a dokun'],
    'This time you serve and they attack.': [
      'Esta vez sacas tú y ellos atacan.',
      'Desta vez você saca e eles atacam.',
      'Cette fois, tu sers et ils attaquent.',
      'Diesmal schlägst du auf und sie greifen an.',
      'Bu sefer servisi sen atıyorsun, onlar hücum ediyor.'],
    'Their hitters glow orange. You expect the set to go to the hitter on your left: commit Left.': [
      'Sus atacantes brillan en naranja. Crees que la colocación irá al atacante de tu izquierda: elige Izquierda.',
      'Os atacantes deles brilham em laranja. Você espera o levantamento para o atacante à sua esquerda: escolha Esquerda.',
      'Leurs attaquants brillent en orange. Tu penses que la passe ira à l\'attaquant sur ta gauche : choisis Gauche.',
      'Ihre Angreifer leuchten orange. Du erwartest das Zuspiel zum Angreifer auf deiner linken Seite: Wähle Links.',
      'Smaççıları turuncu parlıyor. Pasın solundaki smaççıya gideceğini düşünüyorsun: Sol\'u seç.'],
    'Your turn: their hitters glow orange. You expect the set to go to the hitter on your left, so commit Left (tap Left or press 1).': [
      'Tu turno: sus atacantes brillan en naranja. Crees que la colocación irá al atacante de tu izquierda, así que elige Izquierda (toca Izquierda o pulsa 1).',
      'Sua vez: os atacantes deles brilham em laranja. Você espera o levantamento para o atacante à sua esquerda, então escolha Esquerda (toque em Esquerda ou aperte 1).',
      'À toi : leurs attaquants brillent en orange. Tu penses que la passe ira à l\'attaquant sur ta gauche, alors choisis Gauche (touche Gauche ou appuie sur 1).',
      'Du bist dran: Ihre Angreifer leuchten orange. Du erwartest das Zuspiel zum Angreifer auf deiner linken Seite, also wähle Links (tippe auf Links oder drücke 1).',
      'Sıra sende: smaççıları turuncu parlıyor. Pasın solundaki smaççıya gideceğini düşünüyorsun, Sol\'u seç (Sol\'a dokun ya da 1\'e bas).'],
    'In this rally the set goes to the hitter on your left. Commit Left (tap Left or press 1).': [
      'En esta jugada la colocación va al atacante de tu izquierda. Elige Izquierda (toca Izquierda o pulsa 1).',
      'Neste rali o levantamento vai para o atacante à sua esquerda. Escolha Esquerda (toque em Esquerda ou aperte 1).',
      'Dans cet échange, la passe va à l\'attaquant sur ta gauche. Choisis Gauche (touche Gauche ou appuie sur 1).',
      'In diesem Ballwechsel geht das Zuspiel zum Angreifer auf deiner linken Seite. Wähle Links (tippe auf Links oder drücke 1).',
      'Bu rallide pas solundaki smaççıya gidiyor. Sol\'u seç (Sol\'a dokun ya da 1\'e bas).'],
    'All three blockers slide over before the set.': [
      'Tus tres bloqueadores se desplazan antes de la colocación.',
      'Os três bloqueadores se deslocam antes do levantamento.',
      'Tes trois contreurs se décalent avant la passe.',
      'Alle drei Blocker rücken vor dem Zuspiel hinüber.',
      'Üç blokçu da pastan önce o tarafa kayıyor.'],
    'Stuff block! You read it right.': [
      '¡Bloqueo directo! Lo leíste bien.',
      'Bloqueio de ponto! Você leu certo.',
      'Contre gagnant ! Bien lu.',
      'Punktblock! Richtig gelesen.',
      'Sayı bloğu! Doğru okudun.'],
    'Read and dig': ['Leer y defender', 'Ler e defender', 'Lire et défendre', 'Lesen und abwehren', 'Oku ve savun'],
    'Not sure where the set is going? Read keeps your blockers home: two of them watch the set and jump with the hitter. If the spike gets past, your back row digs it. Make no hitter call and your setter chooses for you, but where the spike goes is always your call.': [
      '¿No sabes adónde irá la colocación? Leer mantiene a tus bloqueadores en su sitio: dos de ellos siguen la colocación y saltan con el atacante. Si el remate pasa, tu segunda línea lo defiende. Si no eliges atacante, tu colocador decide por ti, pero adónde va el remate siempre lo decides tú.',
      'Não sabe para onde vai o levantamento? Ler mantém os bloqueadores no lugar: dois deles acompanham o levantamento e saltam com o atacante. Se a cortada passar, o fundo defende. Se você não escolher o atacante, o levantador decide, mas para onde vai a cortada é sempre escolha sua.',
      'Tu ne sais pas où va la passe ? Lire garde tes contreurs en place : deux d\'entre eux suivent la passe et sautent avec l\'attaquant. Si le smash passe, ta ligne arrière le défend. Si tu ne choisis pas l\'attaquant, ton passeur décide, mais l\'endroit où va le smash, c\'est toujours toi qui le choisis.',
      'Unsicher, wohin das Zuspiel geht? Lesen lässt deine Blocker auf ihrer Position: Zwei von ihnen verfolgen das Zuspiel und springen mit dem Angreifer. Kommt der Angriff durch, wehrt deine hintere Reihe ab. Wählst du keinen Angreifer, entscheidet dein Zuspieler, aber wohin der Angriff geht, bestimmst immer du.',
      'Pasın nereye gideceğinden emin değil misin? Oku, blokçularını yerinde tutar: ikisi pası izler ve smaççıyla birlikte zıplar. Smaç geçerse arka sıran savunur. Smaççı seçmezsen pasörün seçer, ama smacın nereye gideceği her zaman senin kararın.'],
    'Press 4 or click Read': [
      'Pulsa 4 o haz clic en Leer',
      'Aperte 4 ou clique em Ler',
      'Appuie sur 4 ou clique sur Lire',
      'Drücke 4 oder klicke auf Lesen',
      '4\'e bas ya da Oku\'ya tıkla'],
    'Tap Read': ['Toca Leer', 'Toque em Ler', 'Touche Lire', 'Tippe auf Lesen', 'Oku\'ya dokun'],
    'You serve again.': [
      'Vuelves a sacar.',
      'Você saca de novo.',
      'Tu sers encore.',
      'Du schlägst wieder auf.',
      'Servisi yine sen atıyorsun.'],
    'This time, pick Read to react to the set instead of guessing.': [
      'Esta vez, elige Leer para reaccionar a la colocación en vez de adivinar.',
      'Desta vez, escolha Ler para reagir ao levantamento em vez de adivinhar.',
      'Cette fois, choisis Lire pour réagir à la passe au lieu de deviner.',
      'Wähle diesmal Lesen, um auf das Zuspiel zu reagieren, statt zu raten.',
      'Bu sefer tahmin etmek yerine pasa tepki vermek için Oku\'yu seç.'],
    'Your turn: not sure where the set goes? Pick Read (tap Read or press 4) so your blockers react to the set.': [
      'Tu turno: ¿no sabes adónde irá la colocación? Elige Leer (toca Leer o pulsa 4) para que tus bloqueadores reaccionen.',
      'Sua vez: não sabe para onde vai o levantamento? Escolha Ler (toque em Ler ou aperte 4) para os bloqueadores reagirem.',
      'À toi : tu ne sais pas où va la passe ? Choisis Lire (touche Lire ou appuie sur 4) pour que tes contreurs réagissent à la passe.',
      'Du bist dran: Unsicher, wohin das Zuspiel geht? Wähle Lesen (tippe auf Lesen oder drücke 4), damit deine Blocker auf das Zuspiel reagieren.',
      'Sıra sende: pasın nereye gideceğinden emin değil misin? Blokçuların pasa tepki versin diye Oku\'yu seç (Oku\'ya dokun ya da 4\'e bas).'],
    'This step is about Read. Tap Read or press 4.': [
      'Este paso trata de Leer. Toca Leer o pulsa 4.',
      'Este passo é sobre Ler. Toque em Ler ou aperte 4.',
      'Cette étape porte sur Lire. Touche Lire ou appuie sur 4.',
      'In diesem Schritt geht es um Lesen. Tippe auf Lesen oder drücke 4.',
      'Bu adım Oku ile ilgili. Oku\'ya dokun ya da 4\'e bas.'],
    'The spike gets past the block, but your back row is already moving to dig it.': [
      'El remate supera el bloqueo, pero tu segunda línea ya va a defenderlo.',
      'A cortada passa pelo bloqueio, mas o seu fundo já está indo defender.',
      'Le smash passe le contre, mais ta ligne arrière se déplace déjà pour le défendre.',
      'Der Angriff kommt am Block vorbei, aber deine hintere Reihe ist schon unterwegs zur Abwehr.',
      'Smaç bloğu geçiyor ama arka sıran savunmak için çoktan harekete geçti.'],
    'No hitter call this time: your setter picks who gets the set.': [
      'Esta vez no eliges atacante: tu colocador decide a quién colocar.',
      'Desta vez sem escolher o atacante: o levantador decide quem recebe o levantamento.',
      'Pas de choix d\'attaquant cette fois : ton passeur choisit qui reçoit la passe.',
      'Diesmal keine Angreiferwahl: Dein Zuspieler entscheidet, wer den Ball bekommt.',
      'Bu sefer smaççı seçimi yok: pası kimin alacağını pasörün seçiyor.'],
    'Point! Dug, set and put away.': [
      '¡Punto! Defendido, colocado y rematado.',
      'Ponto! Defendido, levantado e finalizado.',
      'Point ! Défendu, passé et conclu.',
      'Punkt! Abgewehrt, zugespielt und verwandelt.',
      'Sayı! Savunuldu, pas verildi ve bitirildi.'],
    'Scoring': ['Puntuación', 'Pontuação', 'Score', 'Wertung', 'Skor'],
    'Scoring and rules': [
      'Puntuación y reglas',
      'Pontuação e regras',
      'Score et règles',
      'Wertung und Regeln',
      'Skor ve kurallar'],
    'Rally scoring: every rally wins a point, whoever served.': [
      'Puntuación por jugada: cada jugada da un punto, sin importar quién sacó.',
      'Ponto por rali: todo rali vale um ponto, não importa quem sacou.',
      'Chaque échange rapporte un point, quel que soit le serveur.',
      'Rally-Point: Jeder Ballwechsel bringt einen Punkt, egal wer aufgeschlagen hat.',
      'Her ralli, servisi kim atarsa atsın bir sayı kazandırır.'],
    'Win each set by two. Before a match, choose 5, 11 or 15 points and 1, 3 or 5 sets.': [
      'Gana cada set por dos. Antes del partido, elige 5, 11 o 15 puntos y 1, 3 o 5 sets.',
      'Vença cada set por dois. Antes da partida, escolha 5, 11 ou 15 pontos e 1, 3 ou 5 sets.',
      'Gagne chaque set avec deux points d\'écart. Avant un match, choisis 5, 11 ou 15 points et 1, 3 ou 5 sets.',
      'Gewinne jeden Satz mit zwei Punkten Vorsprung. Wähle vor dem Spiel 5, 11 oder 15 Punkte und 1, 3 oder 5 Sätze.',
      'Her seti iki farkla kazan. Maçtan önce 5, 11 ya da 15 sayı ve 1, 3 ya da 5 set seç.'],
    'Win a rally on their serve and you take the serve; your team rotates one spot.': [
      'Si ganas una jugada con su saque, pasas a sacar; tu equipo rota una posición.',
      'Vença um rali no saque deles e o saque passa para você; seu time roda uma posição.',
      'Gagne un échange sur leur service et tu prends le service ; ton équipe tourne d\'un cran.',
      'Gewinnst du einen Ballwechsel bei ihrem Aufschlag, bekommst du den Aufschlag; dein Team rotiert eine Position.',
      'Onların servisinde ralliyi kazanırsan servis sana geçer; takımın bir pozisyon döner.'],
    'Press P or Esc to pause. Wins earn stars to spend in the Shop.': [
      'Pulsa P o Esc para pausar. Las victorias dan estrellas para gastar en la Tienda.',
      'Aperte P ou Esc para pausar. Vitórias dão estrelas para gastar na Loja.',
      'Appuie sur P ou Échap pour mettre en pause. Les victoires rapportent des étoiles à dépenser dans la Boutique.',
      'Drücke P oder Esc für Pause. Siege bringen Sterne für den Shop.',
      'Duraklatmak için P ya da Esc\'ye bas. Galibiyetler Mağaza\'da harcayacağın yıldızlar kazandırır.'],
    'Play online: create a room and send the code to a friend.': [
      'Juega en línea: crea una sala y envía el código a un amigo.',
      'Jogue online: crie uma sala e mande o código para um amigo.',
      'Jouer en ligne : crée une salle et envoie le code à un ami.',
      'Online spielen: Erstelle einen Raum und schick den Code an einen Freund.',
      'Çevrimiçi oyna: bir oda kur ve kodu bir arkadaşına gönder.'],
    'The scoreboard: points in white, sets in gold. The small ball marks who serves.': [
      'El marcador: puntos en blanco, sets en dorado. El balón pequeño indica quién saca.',
      'O placar: pontos em branco, sets em dourado. A bolinha mostra quem saca.',
      'Le tableau : les points en blanc, les sets en or. Le petit ballon montre qui sert.',
      'Die Anzeige: Punkte in Weiß, Sätze in Gold. Der kleine Ball zeigt, wer aufschlägt.',
      'Skor tabelası: sayılar beyaz, setler altın renkli. Küçük top servisi kimin attığını gösterir.'],
    'You are ready. Play a match, or try any skill again.': [
      'Ya estás listo. Juega un partido o repite cualquier habilidad.',
      'Você está pronto. Jogue uma partida ou repita qualquer habilidade.',
      'Tu es prêt. Joue un match, ou refais n\'importe quelle compétence.',
      'Du bist bereit. Spiel ein Match oder probier einen Spielzug noch einmal.',
      'Hazırsın. Bir maç oyna ya da istediğin beceriyi tekrar dene.'],
    // ---- 2026-10-26: aim rule, opening screen, venues ----
    'NO AIM': [
      'SIN APUNTAR',
      'SEM MIRA',
      'PAS VISÉ',
      'KEIN ZIEL',
      'NİŞAN YOK'],
    'Pick a spot to spike': [
      'Elige un punto para rematar',
      'Escolha um ponto para atacar',
      'Choisis un point pour smasher',
      'Wähle einen Punkt für den Angriff',
      'Smaç için bir nokta seç'],
    'The spike is still yours to aim: tap open floor on their court.': [
      'El remate lo apuntas tú: toca suelo libre en su campo.',
      'A mira da cortada continua sendo sua: toque no chão livre da quadra deles.',
      'Le smash, c\'est toujours toi qui le vises : touche un espace libre sur leur terrain.',
      'Den Angriff zielst trotzdem du: Tippe auf freie Fläche in ihrem Feld.',
      'Smaça yine sen nişan alırsın: rakip sahada boş bir alana dokun.'],
    'Your turn: the setter chose the hitter, but you aim the spike. Tap open floor on their court (or pick Line, Cross or Tool).': [
      'Tu turno: el colocador eligió al atacante, pero tú apuntas el remate. Toca suelo libre en su campo (o elige Línea, Diagonal o Rebote).',
      'Sua vez: o levantador escolheu o atacante, mas você mira a cortada. Toque no chão livre da quadra deles (ou escolha Paralela, Diagonal ou Explorar).',
      'À toi : le passeur a choisi l\'attaquant, mais c\'est toi qui vises le smash. Touche un espace libre sur leur terrain (ou choisis Ligne, Diagonale ou Bloc-out).',
      'Du bist dran: Der Zuspieler hat den Angreifer gewählt, aber du zielst den Angriff. Tippe auf freie Fläche in ihrem Feld (oder wähle Linie, Diagonal oder Blockout).',
      'Sıra sende: smaççıyı pasör seçti ama smaça sen nişan alırsın. Rakip sahada boş bir alana dokun (ya da Çizgi, Çapraz veya Blok-aut seç).'],
    'New here? Learn it in a minute': [
      '¿Eres nuevo? Apréndelo en un minuto',
      'Primeira vez? Aprenda em um minuto',
      'Nouveau ? Apprends en une minute',
      'Neu hier? In einer Minute gelernt',
      'Yeni misin? Bir dakikada öğren'],
    'Watch a short demo of the calls you make in every rally.': [
      'Mira una demo corta de las decisiones que tomas en cada jugada.',
      'Assista a uma demo curta das escolhas que você faz em cada rali.',
      'Regarde une courte démo des choix que tu fais à chaque échange.',
      'Sieh dir eine kurze Demo der Entscheidungen an, die du in jedem Ballwechsel triffst.',
      'Her rallide verdiğin kararların kısa bir demosunu izle.'],
    'Attack': [
      'Ataque',
      'Ataque',
      'Attaque',
      'Angriff',
      'Hücum'],
    'Watch demo': [
      'Ver demo',
      'Ver demo',
      'Voir la démo',
      'Demo ansehen',
      'Demoyu izle'],
    'Skip': [
      'Saltar',
      'Pular',
      'Passer',
      'Überspringen',
      'Geç'],
    'You can watch it again any time from How to play.': [
      'Puedes volver a verla cuando quieras desde Cómo jugar.',
      'Você pode ver de novo quando quiser em Como jogar.',
      'Tu peux la revoir à tout moment depuis Comment jouer.',
      'Du kannst sie jederzeit unter So wird gespielt wieder ansehen.',
      'Nasıl oynanır bölümünden istediğin zaman tekrar izleyebilirsin.'],
    'Venue': [
      'Sede',
      'Local',
      'Salle',
      'Spielort',
      'Salon'],
    'Tournament final': [
      'Final del torneo',
      'Final do torneio',
      'Finale du tournoi',
      'Turnierfinale',
      'Turnuva finali'],
    'Your home court': [
      'Tu cancha local',
      'Sua quadra em casa',
      'Ton terrain à domicile',
      'Deine Heimhalle',
      'Kendi iç saha salonun'],
    'Home of the {team}': [
      'Casa de {team}',
      'Casa do {team}',
      'Domicile des {team}',
      'Heimat der {team}',
      '{team} takımının evi'],
    // ---- 2026-10-26: more courts ----
    'Court': ['Cancha', 'Quadra', 'Terrain', 'Feld', 'Saha'],
    'My court': ['Mi cancha', 'Minha quadra', 'Mon terrain', 'Mein Feld', 'Benim saham'],
    'Neon Grid': ['Rejilla neón', 'Grade neon', 'Grille néon', 'Neon-Gitter', 'Neon Izgara'],
    'Cherry Blossom': ['Flor de cerezo', 'Flor de cerejeira', 'Fleur de cerisier', 'Kirschblüte', 'Kiraz Çiçeği'],
    'Desert Dunes': ['Dunas del desierto', 'Dunas do deserto', 'Dunes du désert', 'Wüstendünen', 'Çöl Kumulları'],
    'Street Park': ['Parque urbano', 'Parque de rua', 'Parc urbain', 'Straßenpark', 'Sokak Parkı'],
    'Galaxy': ['Galaxia', 'Galáxia', 'Galaxie', 'Galaxie', 'Galaksi'],
    'Lava Pit': ['Pozo de lava', 'Poço de lava', 'Fosse de lave', 'Lavagrube', 'Lav Çukuru'],
    'Candy Land': ['Tierra de dulces', 'Terra dos doces', 'Pays des bonbons', 'Zuckerland', 'Şeker Diyarı'],
    'Retro Arcade': ['Arcade retro', 'Fliperama retrô', 'Arcade rétro', 'Retro-Arcade', 'Retro Atari']
  };

  var lang = 'en', table = {};

  function pick(code) {
    code = String(code || '').toLowerCase().slice(0, 2);
    return SR.LANGS[code] ? code : null;
  }

  // Player's choice, ?lang= (for testing), CrazyGames locale, browser, English.
  function detect() {
    var saved = SR.save && SR.save.data.settings.lang;
    if (pick(saved)) return pick(saved);
    try { var q = pick(new URLSearchParams(window.location.search).get('lang')); if (q) return q; } catch (e) { /* ignore */ }
    var cg = pick(SR.cg && SR.cg.locale);
    if (cg) return cg;
    var list = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language]) || [];
    for (var i = 0; i < list.length; i++) { var l = pick(list[i]); if (l) return l; }
    return 'en';
  }

  function build(code) {
    table = {};
    var i = ORDER.indexOf(code);
    if (i < 0) return;
    Object.keys(S).forEach(function (k) { table[k] = S[k][i]; });
  }

  SR.t = function (key, vars) {
    var s = table[key];
    if (s == null) s = key;
    if (vars) s = s.replace(/\{(\w+)\}/g, function (m, k) { return k in vars ? vars[k] : m; });
    return s;
  };

  // Upper case that knows Turkish dotted/dotless i.
  SR.upper = function (s) { try { return s.toLocaleUpperCase(lang); } catch (e) { return s.toUpperCase(); } };

  SR.formatLabel = function (f) {
    return f.sets === 1 ? SR.t('1 set to {p}', { p: f.points }) : SR.t('Best of {n}, sets to {p}', { n: f.sets, p: f.points });
  };

  // Translate the page's fixed text. English originals are kept on each node
  // so switching language later works from the source text.
  function applyPage() {
    document.documentElement.lang = lang;
    var walker = document.createTreeWalker(document.getElementById('app'), NodeFilter.SHOW_TEXT, null);
    var n;
    while ((n = walker.nextNode())) {
      if (n.__en == null) {
        if (!/[A-Za-z]/.test(n.nodeValue) || (n.parentNode && n.parentNode.closest('[data-i18n],[data-i18n-skip]'))) continue;
        n.__en = n.nodeValue;
      }
      var en = n.__en, key = en.trim();
      n.nodeValue = en.replace(key, SR.t(key));
    }
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      if (el.__en == null) el.__en = el.innerHTML;
      var k = el.getAttribute('data-i18n');
      el.innerHTML = table[k] != null ? table[k] : el.__en;
    });
    document.querySelectorAll('[aria-label]').forEach(function (el) {
      if (el.__enLabel == null) el.__enLabel = el.getAttribute('aria-label');
      el.setAttribute('aria-label', SR.t(el.__enLabel));
    });
  }

  SR.i18n = {
    lang: function () { return lang; },
    init: function () {
      lang = detect();
      build(lang);
      applyPage();
    },
    // code: a language code, or 'auto' to follow the device again.
    set: function (code) {
      SR.save.data.settings.lang = pick(code) || 'auto';
      SR.save.write();
      SR.i18n.init();
    }
  };
})();
