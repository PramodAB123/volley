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
      '<b>Ataque.</b> Mientras el balón está en el aire, elige rápido un golpe con los botones o las teclas 1 a 6 y haz clic donde debe caer: <b>Potencia</b> es el más rápido; <b>Línea</b> y <b>Diagonal</b> apuntan solos por la banda o cruzado; <b>Globo</b> es un golpe lento y alto por encima del bloqueo; <b>Finta</b> lo deja caer justo tras la red; <b>Rebote</b> golpea las manos del bloqueo para mandarlo fuera. Apuntar justo a las líneas es arriesgado.',
      '<b>Ataque.</b> Enquanto a bola está no ar, escolha rápido um golpe com os botões ou as teclas 1 a 6 e clique onde ela deve cair: <b>Força</b> é o mais rápido; <b>Paralela</b> e <b>Diagonal</b> miram sozinhos pela lateral ou cruzado; <b>Meia-força</b> é um golpe lento e alto por cima do bloqueio; <b>Largada</b> deixa a bola logo atrás da rede; <b>Explorar</b> bate nas mãos do bloqueio para mandar a bola para fora. Mirar bem nas linhas é arriscado.',
      '<b>Attaque.</b> Pendant que la passe est en l\'air, choisis vite un coup avec les boutons ou les touches 1 à 6, puis clique où le ballon doit tomber : <b>Puissance</b> est le plus rapide ; <b>Ligne</b> et <b>Diagonale</b> visent seuls le long de la ligne ou en travers ; <b>Lob</b> est un coup lent et haut par-dessus le contre ; <b>Feinte</b> le dépose juste derrière le filet ; <b>Bloc-out</b> frappe les mains du contre pour envoyer le ballon dehors. Viser pile sur les lignes est risqué.',
      '<b>Angriff.</b> Während das Zuspiel in der Luft ist, wähle schnell einen Schlag mit den Knöpfen oder den Tasten 1 bis 6 und klicke, wo der Ball landen soll: <b>Wucht</b> ist am schnellsten; <b>Linie</b> und <b>Diagonal</b> zielen selbst entlang der Seitenlinie oder quer; <b>Lob</b> ist ein langsamer, hoher Ball über den Block; <b>Leger</b> legt ihn knapp hinters Netz; <b>Blockout</b> schlägt an die Hände des Blocks, damit der Ball ins Aus geht. Genau auf die Linien zu zielen ist riskant.',
      '<b>Hücum.</b> Pas havadayken düğmelerle ya da 1 ile 6 arası tuşlarla hızlıca bir vuruş seç, sonra topun düşeceği yere tıkla: <b>Güçlü</b> en hızlısıdır; <b>Çizgi</b> ve <b>Çapraz</b> kendiliğinden kenar çizgisine ya da çapraza nişan alır; <b>Yumuşak</b> bloğun üstünden boşluğa giden yavaş, yüksek bir vuruştur; <b>Plase</b> topu filenin hemen arkasına bırakır; <b>Blok-aut</b> topu blokçuların ellerinden dışarı çıkarır. Tam çizgilere nişan almak risklidir.'],
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
    'WRONG GUESS': ['FALLASTE', 'ERROU', 'RATÉ', 'FALSCH GERATEN', 'YANLIŞ TAHMİN']
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
