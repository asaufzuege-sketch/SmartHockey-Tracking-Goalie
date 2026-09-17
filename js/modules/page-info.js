// Page-Specific Info Module

App.pageInfo = (function() {
    console.log('Page Info Module loading...');
    
    // Page-specific info content for all languages
    const pageInfos = {
        'team-selection': {
            de: `📋 Team Selection

Hier wählst du dein Team aus oder erstellst ein neues Team.

• Team wählen oder bearbeiten
• Klick auf "Select" um ein Team auszuwählen
• Klick auf ✏️ um den Teamnamen zu bearbeiten
• Nach der Auswahl gelangst du zur Player Selection

📥 Backup & Datensicherung
⚠️ Wir übernehmen keine Haftung für verlorene Daten.
• **Wir empfehlen dringend, nach jedem Spiel ein Backup zu erstellen.**
• Durch das Löschen der Browserdaten (z.B. in Google Chrome) werden sämtliche App-Daten unwiderruflich gelöscht. Unbedingt vorher ein Backup erstellen!
• 📥 Download Backup: Alle App-Daten als JSON-Datei herunterladen. Die Datei wird im Ordner „Downloads" gespeichert.
• 📤 Restore Backup: Eine zuvor heruntergeladene JSON-Backup-Datei hochladen und alle Daten wiederherstellen.

🆕 Neu: Goalie Stats
Auf der Season-Seite gibt es jetzt einen Toggle-Button „Goalies / Players", mit dem du zwischen den Feldspieler-Statistiken und einer separaten Goalie-Tabelle (MIN, GA, SA, SV, Sv%, GAA, SO, MVP …) umschalten kannst. Die Goalie-Daten werden beim „Export Season" automatisch aus deinen Goal Map-Ereignissen berechnet und du wirst nach der Spielzeit deiner Goalies gefragt.`,
            
            en: `📋 Team Selection

Here you select your team or create a new team.

• Choose or edit team
• Click "Select" to choose a team
• Click ✏️ to edit the team name
• After selection, you proceed to Player Selection

📥 Backup & Data Protection
⚠️ We assume no liability for lost data.
• **We strongly recommend creating a backup after every game.**
• Clearing browser data (e.g. in Google Chrome) will permanently delete all app data. Always create a backup before doing so!
• 📥 Download Backup: Download all app data as a JSON file. The file is saved to the "Downloads" folder.
• 📤 Restore Backup: Upload a previously downloaded JSON backup file to restore all data.

🆕 New: Goalie Stats
The Season page now features a toggle button "Goalies / Players" that lets you switch between the skater statistics and a dedicated Goalie table (MIN, GA, SA, SV, Sv%, GAA, SO, MVP …). Goalie data is calculated automatically from your Goal Map events during "Export Season" — you will be prompted to enter each goalie's ice time.`,
            
            ru: `📋 Team Selection

Здесь вы выбираете свою команду или создаёте новую команду.

• Выбрать или редактировать команду
• Нажмите "Select" чтобы выбрать команду
• Нажмите ✏️ чтобы изменить название команды
• После выбора вы переходите к Player Selection

📥 Резервное копирование и защита данных
⚠️ Мы не несём ответственности за потерянные данные.
• **Мы настоятельно рекомендуем создавать резервную копию после каждой игры.**
• При очистке данных браузера (например, в Google Chrome) все данные приложения будут безвозвратно удалены. Обязательно создайте резервную копию перед этим!
• 📥 Скачать Backup: Скачать все данные приложения в формате JSON. Файл сохраняется в папку «Загрузки».
• 📤 Восстановить Backup: Загрузить ранее сохранённый JSON-файл для восстановления всех данных.

🆕 Новое: Goalie Stats
На странице Season теперь есть кнопка-переключатель «Goalies / Players», с помощью которой можно переключаться между статистикой полевых игроков и отдельной таблицей вратарей (MIN, GA, SA, SV, Sv%, GAA, SO, MVP …). Данные вратарей рассчитываются автоматически из событий Goal Map при «Export Season» — вам будет предложено ввести игровое время каждого вратаря.`,
            
            sv: `📋 Team Selection

Här väljer du ditt lag eller skapar ett nytt lag.

• Välj eller redigera lag
• Klicka på "Select" för att välja ett lag
• Klicka på ✏️ för att redigera lagnamnet
• Efter valet går du vidare till Player Selection

📥 Backup & Datasäkring
⚠️ Vi tar inget ansvar för förlorad data.
• **Vi rekommenderar starkt att du skapar en backup efter varje match.**
• Om du rensar webbläsardata (t.ex. i Google Chrome) raderas alla appdata permanent. Skapa alltid en backup innan!
• 📥 Download Backup: Ladda ner all appdata som en JSON-fil. Filen sparas i mappen "Nedladdningar".
• 📤 Restore Backup: Ladda upp en tidigare nedladdad JSON-backupfil för att återställa all data.

🆕 Nytt: Goalie Stats
På Season-sidan finns nu en toggleknapp „Goalies / Players" som låter dig växla mellan spelarstatistik och en separat målvaktstabell (MIN, GA, SA, SV, Sv%, GAA, SO, MVP …). Målvaktsdata beräknas automatiskt från dina Goal Map-händelser vid „Export Season" — du ombeds ange spelminuter för varje målvakt.`,
            
            fi: `📋 Team Selection

Täällä valitset joukkueesi tai luot uuden joukkueen.

• Valitse tai muokkaa joukkuetta
• Napsauta "Select" valitaksesi joukkueen
• Napsauta ✏️ muokataksesi joukkueen nimeä
• Valinnan jälkeen siirryt Player Selectioniin

📥 Varmuuskopiointi ja tietosuoja
⚠️ Emme vastaa kadonneista tiedoista.
• **Suosittelemme vahvasti varmuuskopion luomista jokaisen pelin jälkeen.**
• Selaimen tietojen tyhjentäminen (esim. Google Chromessa) poistaa kaikki sovellustiedot pysyvästi. Luo aina varmuuskopio ennen sitä!
• 📥 Lataa varmuuskopio: Lataa kaikki sovellustiedot JSON-tiedostona. Tiedosto tallennetaan "Lataukset"-kansioon.
• 📤 Palauta varmuuskopio: Lataa aiemmin tallennettu JSON-varmuuskopiotiedosto palauttaaksesi kaikki tiedot.

🆕 Uutta: Goalie Stats
Season-sivulla on nyt vaihtonappula „Goalies / Players", jonka avulla voit vaihtaa kenttäpelaajatilastojen ja erillisen maalivahtitaulukon (MIN, GA, SA, SV, Sv%, GAA, SO, MVP …) välillä. Maalivahdin tiedot lasketaan automaattisesti Goal Map -tapahtumistasi „Export Season" -toiminnon aikana — sinulta kysytään kunkin maalivahdin peliminuutit.`,
            
            fr: `📋 Team Selection

Ici tu sélectionnes ton équipe ou crées une nouvelle équipe.

• Choisis ou modifie l'équipe
• Clique sur "Select" pour choisir une équipe
• Clique sur ✏️ pour modifier le nom de l'équipe
• Après la sélection, tu passes à Player Selection

📥 Sauvegarde & Protection des données
⚠️ Nous déclinons toute responsabilité en cas de perte de données.
• **Nous recommandons fortement de créer une sauvegarde après chaque match.**
• La suppression des données du navigateur (par ex. dans Google Chrome) supprimera définitivement toutes les données de l'application. Créez toujours une sauvegarde avant !
• 📥 Télécharger Backup: Téléchargez toutes les données de l'application sous forme de fichier JSON. Le fichier est enregistré dans le dossier « Téléchargements ».
• 📤 Restaurer Backup: Téléchargez un fichier JSON de sauvegarde précédemment téléchargé pour restaurer toutes les données.

🆕 Nouveau : Goalie Stats
La page Season dispose maintenant d'un bouton toggle « Goalies / Players » pour basculer entre les statistiques des patineurs et un tableau dédié aux gardiens (MIN, GA, SA, SV, Sv%, GAA, SO, MVP …). Les données des gardiens sont calculées automatiquement à partir de tes événements Goal Map lors de l'« Export Season » — tu seras invité(e) à saisir le temps de jeu de chaque gardien.`
        },
        
        'player-selection': {
            de: `👥 Player Selection

• Spieler erfassen/bearbeiten: Nummer, Name, Position (G = Goalie, W = Wing, C = Center, D = Defense).
• Aktivieren (Checkbox) = Spieler ist für Line Up / Game Center verfügbar.
• Buttons: „Line Up" → zur Aufstellung; „Game Center" → direkt zur Spiel-Erfassung.`,
            
            en: `👥 Player Selection

• Add/edit players: Number, Name, Position (G = Goalie, W = Wing, C = Center, D = Defense).
• Activate (checkbox) = Player available for Line Up / Game Center.
• Buttons: "Line Up" → to lineup; "Game Center" → directly to game recording.`,
            
            ru: `👥 Player Selection

• Добавить/редактировать игроков: Номер, Имя, Позиция (G = Вратарь, W = Крайний, C = Центр, D = Защитник).
• Активировать (чекбокс) = Игрок доступен для Line Up / Game Center.
• Кнопки: «Line Up» → к составу; «Game Center» → сразу к записи игры.`,
            
            sv: `👥 Player Selection

• Lägg till/redigera spelare: Nummer, Namn, Position (G = Målvakt, W = Wing, C = Center, D = Back).
• Aktivera (kryssruta) = Spelare tillgänglig för Line Up / Game Center.
• Knappar: "Line Up" → till uppställning; "Game Center" → direkt till matchregistrering.`,
            
            fi: `👥 Player Selection

• Lisää/muokkaa pelaajia: Numero, Nimi, Pelipaikka (G = Maalivahti, W = Laitahyökkääjä, C = Keskushyökkääjä, D = Puolustaja).
• Aktivoi (valintaruutu) = Pelaaja käytettävissä Line Up / Game Center.
• Painikkeet: "Line Up" → kokoonpanoon; "Game Center" → suoraan pelin tallennukseen.`,
            
            fr: `👥 Player Selection

• Ajouter/modifier des joueurs: Numéro, Nom, Position (G = Gardien, W = Ailier, C = Centre, D = Défense).
• Activer (case à cocher) = Joueur disponible pour Line Up / Game Center.
• Boutons: "Line Up" → vers la formation; "Game Center" → directement à l'enregistrement du jeu.`
        },
        
        'line-up': {
            de: `📋 Line Up

Modi (umschaltbar per Modus-Button):

• Balanced: Ausgeglichenes Line Up. Vorgabe durch AI-Logik und Formeln.
• Power: Stärkstes Line Up, Spezial-Setup für entscheidende Szenen. Vorgabe durch AI-Logik und Formeln.
• Manuell: Frei erstellbares Line Up per Klick auf Position belegen.
• „Player Out": Spieler als OUT markieren (Bei Penalty-Strafe). Line Up wird automatisch angepasst.`,
            
            en: `📋 Line Up

Modes (switchable via Mode button):

• Balanced: Balanced Line Up. Preset by AI logic and formulas.
• Power: Strongest Line Up, special setup for decisive scenes. Preset by AI logic and formulas.
• Manual: Freely creatable Line Up by clicking on position to assign.
• "Player Out": Mark player as OUT (for penalty). Line Up is automatically adjusted.`,
            
            ru: `📋 Line Up

Режимы (переключаемые кнопкой режима):

• Balanced: Сбалансированный состав. Предустановка через AI-логику и формулы.
• Power: Сильнейший состав, специальная расстановка для решающих моментов. Предустановка через AI-логику и формулы.
• Manuell: Свободно создаваемый состав, назначение по клику на позицию.
• „Player Out": Отметить игрока как OUT (при удалении). Состав автоматически корректируется.`,
            
            sv: `📋 Line Up

Lägen (växlingsbart via Lägesknapp):

• Balanced: Balanserad Line Up. Förinställd av AI-logik och formler.
• Power: Starkaste Line Up, specialuppställning för avgörande scener. Förinställd av AI-logik och formler.
• Manuell: Fritt skapbar Line Up genom att klicka på position för att tilldela.
• "Player Out": Markera spelare som OUT (vid utvisning). Line Up justeras automatiskt.`,
            
            fi: `📋 Line Up

Tilat (vaihdettavissa Tila-painikkeella):

• Balanced: Tasapainoinen kokoonpano. AI-logiikan ja kaavojen esiasetus.
• Power: Vahvin kokoonpano, erikoisasettelu ratkaiseviin tilanteisiin. AI-logiikan ja kaavojen esiasetus.
• Manuell: Vapaasti luotava kokoonpano klikkaamalla paikkaa.
• "Player Out": Merkitse pelaaja OUT (rangaistuksessa). Kokoonpano mukautuu automaattisesti.`,
            
            fr: `📋 Line Up

Modes (commutables via le bouton Mode):

• Balanced: Line Up équilibré. Prédéfini par la logique AI et les formules.
• Power: Line Up le plus fort, configuration spéciale pour les scènes décisives. Prédéfini par la logique AI et les formules.
• Manuell: Line Up librement créable en cliquant sur la position à attribuer.
• "Player Out": Marquer le joueur comme OUT (en cas de pénalité). Le Line Up est automatiquement ajusté.`
        },
        
        'season': {
            de: `📊 Season

Auf der Season-Seite siehst du die kumulierten Statistiken aller Spiele, die du per „Export Season" hinzugefügt hast. Über den Toggle-Button oben („Goalies" / „Players") wechselst du zwischen Feldspieler- und Goalie-Tabelle.

Bedienung (Player-Tabelle):
• Klick / Doppelklick auf Werte: +1 / –1 (bei +/- auch negativ)
• Long-Press auf Time-Zelle: Zeit manuell eingeben
• Positionsfilter (Dropdown „Pos."): C, LW, RW, D
• Spaltenkopf klicken: Sortierung auf/absteigend

🏒 Player Stats — Abkürzungen
• Games — Anzahl gespielter Spiele
• Goals — erzielte Tore
• Assists — Vorlagen (Assists)
• Points — Goals + Assists
• +/- — Plus/Minus: Tore für vs. gegen die eigene Mannschaft während der Eiszeit des Spielers
• Ø +/- — Durchschnittliches +/- pro Spiel
• Shots — Torschüsse
• Shots/Game — Schüsse pro Spiel
• Shots % — Trefferquote: Goals ÷ Shots (Effizienz vor dem Tor)
• Goals/Game — Tore pro Spiel
• Points/Game — Punkte pro Spiel (Scoring-Rate)
• Penalty — Strafminuten
• Goal Value — gewichtete Torqualität (starke Gegner zählen mehr, siehe Goal Value-Seite)
• FaceOffs — Bullys insgesamt
• FaceOffs Won — gewonnene Bullys
• FaceOffs % — Bully-Erfolgsquote
• SF/min — Shots For pro Minute Eiszeit: Team-Schüsse für uns während der Eiszeit des Spielers (misst offensive Präsenz der Linie/des Spielers)
• SA/min — Shots Against pro Minute Eiszeit: Team-Schüsse gegen uns während der Eiszeit des Spielers (niedriger ist besser — defensive Präsenz)
• Shot Share % — Puckbesitz-Kennzahl (Corsi-ähnlich): Anteil eigener Schüsse an allen Schüssen während der Eiszeit; > 50 % = Team dominiert das Spiel, wenn dieser Spieler auf dem Eis ist
• MVP — Rang in der MVP-Wertung (1 = wertvollster Spieler)
• MVP Points — Punktzahl der MVP-Formel (KI-gestützt: Tore, Assists, +/-, Shots %, Goal Value, Spielzeit)

Bewertung:
• Points/Game und Shots % zeigen die individuelle Klasse
• +/- und Ø +/- zeigen Zwei-Wege-Spiel und Team-Beitrag
• Goal Value bewertet gegen wen die Tore fielen
• MVP Points kombiniert alles zu einer Gesamtwertung
• SF/min, SA/min und Shot Share % zeigen den Team-Effekt bei Eiszeit des Spielers (unabhängig davon, ob er selbst schießt oder trifft)

🥅 Goalie Stats — Abkürzungen
Über den Button „Goalies" oben rechts umschalten.
• Games — Spiele, in denen der Goalie eingesetzt wurde
• MIN — gespielte Minuten (MM:SS)
• GA — Goals Against: Gegentore
• SA — Shots Against: Schüsse aufs Tor
• SV — Saves: gehaltene Schüsse (SA – GA)
• Sv% — Save Percentage: SV ÷ SA (je höher, desto besser; Elite ≥ 92%)
• GAA — Goals Against Average: Gegentore pro 60 Minuten (je niedriger, desto besser; Elite ≤ 2.00)
• SO — Shutouts: Spiele ohne Gegentor
• Goal Value — invertierte Gegner-Gewichtung: Gegentore gegen schwache Gegner werden stärker gewichtet (bestraft)
• MVP — Rang in der Goalie-MVP-Wertung
• MVP Points — Sv% × Spielzeit-Konfidenz – Goal Value/Spiel + Einsatzbonus

Bewertung:
• Sv% ist die wichtigste Einzelkennzahl für Goalies
• GAA ergänzt Sv% (berücksichtigt auch, wie viele Schüsse durchkommen)
• SO zeigt Top-Leistungen
• Total-Zeile: MIN/GA/SA/SV = Summen, Sv%/GAA = Ø

Ablauf beim Export Season:
1. Goal Value für den Gegner eingeben (Sterne 0.5–5.0)
2. Spielzeit der Goalies eingeben (MM:SS; leer oder 0 = nicht gespielt)
3. Beide Tabellen (Skater + Goalie) werden aktualisiert`,

            en: `📊 Season

The Season page shows the cumulative statistics of all games you have added via "Export Season". Use the toggle button at the top ("Goalies" / "Players") to switch between the skater table and the goalie table.

Controls (Player table):
• Click / double-click on values: +1 / –1 (for +/- also negative)
• Long-press on time cell: enter time manually
• Position filter (dropdown "Pos."): C, LW, RW, D
• Click column header: sort ascending/descending

🏒 Player Stats — Abbreviations
• Games — number of games played
• Goals — goals scored
• Assists — assists
• Points — Goals + Assists
• +/- — Plus/Minus: goals for vs. against your team while the player is on ice
• Ø +/- — average +/- per game
• Shots — shots on goal
• Shots/Game — shots per game
• Shots % — shooting percentage: Goals ÷ Shots (efficiency in front of goal)
• Goals/Game — goals per game
• Points/Game — points per game (scoring rate)
• Penalty — penalty minutes
• Goal Value — weighted goal quality (goals against strong opponents count more, see Goal Value page)
• FaceOffs — total face-offs
• FaceOffs Won — face-offs won
• FaceOffs % — face-off win percentage
• SF/min — Shots For per minute of ice time: team shots for us while the player is on ice (measures offensive line presence)
• SA/min — Shots Against per minute of ice time: team shots against us while the player is on ice (lower is better — defensive presence)
• Shot Share % — possession metric (Corsi-like): share of own shots out of all shots while on ice; > 50% = team dominates when this player is on the ice
• MVP — rank in MVP rating (1 = most valuable player)
• MVP Points — MVP formula score (AI-based: goals, assists, +/-, Shots %, Goal Value, ice time)

How to interpret:
• Points/Game and Shots % show individual class
• +/- and Ø +/- show two-way play and team contribution
• Goal Value rates who the goals were scored against
• MVP Points combines everything into one overall rating
• SF/min, SA/min and Shot Share % show the team effect during the player's ice time (regardless of whether they personally shoot or score)

🥅 Goalie Stats — Abbreviations
Switch via the "Goalies" button in the top right.
• Games — games in which the goalie was used
• MIN — minutes played (MM:SS)
• GA — Goals Against: goals conceded
• SA — Shots Against: shots on goal
• SV — Saves: shots stopped (SA – GA)
• Sv% — Save Percentage: SV ÷ SA (higher is better; elite ≥ 92%)
• GAA — Goals Against Average: goals conceded per 60 minutes (lower is better; elite ≤ 2.00)
• SO — Shutouts: games without a goal conceded
• Goal Value — inverted opponent weighting: goals against weak opponents are penalised more heavily
• MVP — rank in the goalie MVP rating
• MVP Points — Sv% × ice-time confidence – Goal Value/game + deployment bonus

How to interpret:
• Sv% is the single most important goalie stat
• GAA complements Sv% (also reflects how many shots get through)
• SO highlights top performances
• Total row: MIN/GA/SA/SV = sums, Sv%/GAA = averages

Export Season workflow:
1. Enter Goal Value for the opponent (stars 0.5–5.0)
2. Enter goalie ice time (MM:SS; leave blank or 0 = did not play)
3. Both tables (skaters + goalies) are updated`,

            ru: `📊 Season

На странице Season отображается накопленная статистика всех игр, добавленных через «Export Season». Кнопка-переключатель вверху («Goalies» / «Players») позволяет переключаться между таблицей полевых игроков и таблицей вратарей.

Управление (таблица игроков):
• Клик / двойной клик по значениям: +1 / –1 (для +/- также отрицательное)
• Долгое нажатие на ячейку времени: ввод времени вручную
• Фильтр позиций (выпадающий список «Pos.»): C, LW, RW, D
• Клик на заголовок столбца: сортировка по возрастанию/убыванию

🏒 Player Stats — Расшифровка
• Games — количество сыгранных игр
• Goals — забитые голы
• Assists — передачи (ассисты)
• Points — Goals + Assists
• +/- — Плюс/Минус: голы за и против своей команды во время пребывания игрока на льду
• Ø +/- — средний +/- за игру
• Shots — броски в створ
• Shots/Game — броски за игру
• Shots % — процент реализации: Goals ÷ Shots (эффективность перед воротами)
• Goals/Game — голы за игру
• Points/Game — очки за игру (результативность)
• Penalty — штрафные минуты
• Goal Value — взвешенное качество голов (голы против сильных соперников ценятся выше, см. страницу Goal Value)
• FaceOffs — вбрасывания всего
• FaceOffs Won — выигранные вбрасывания
• FaceOffs % — процент побед на вбрасываниях
• SF/min — бросков «за» в минуту: командные броски в нашу пользу во время пребывания игрока на льду (показывает наступательное присутствие)
• SA/min — бросков «против» в минуту: командные броски против нас во время игрока на льду (чем ниже, тем лучше — оборонительное присутствие)
• Shot Share % — метрика владения шайбой (аналог Corsi): доля наших бросков от всех бросков во время игрока на льду; > 50% = команда доминирует в игре
• MVP — место в рейтинге MVP (1 = самый ценный игрок)
• MVP Points — баллы формулы MVP (ИИ: голы, ассисты, +/-, Shots %, Goal Value, время на льду)

Интерпретация:
• Points/Game и Shots % отражают индивидуальный класс игрока
• +/- и Ø +/- показывают игру в обе стороны и вклад в команду
• Goal Value оценивает, против каких соперников были забиты голы
• MVP Points объединяет всё в единый рейтинг
• SF/min, SA/min и Shot Share % показывают командный эффект при выходе игрока на лёд (независимо от личных бросков или голов)

🥅 Goalie Stats — Расшифровка
Переключение через кнопку «Goalies» справа вверху.
• Games — игры, в которых вратарь участвовал
• MIN — сыгранные минуты (ММ:СС)
• GA — Goals Against: пропущенные голы
• SA — Shots Against: броски в створ
• SV — Saves: отражённые броски (SA – GA)
• Sv% — Save Percentage: SV ÷ SA (чем выше, тем лучше; элита ≥ 92%)
• GAA — Goals Against Average: пропущенных голов за 60 минут (чем ниже, тем лучше; элита ≤ 2.00)
• SO — Shutouts: игры без пропущенных голов
• Goal Value — инвертированное взвешивание: голы от слабых соперников штрафуются сильнее
• MVP — место в рейтинге MVP вратарей
• MVP Points — Sv% × доверительность игрового времени – Goal Value/игра + бонус за участие

Интерпретация:
• Sv% — важнейший показатель для вратаря
• GAA дополняет Sv% (учитывает количество пропущенных бросков)
• SO выделяет лучшие выступления
• Итоговая строка: MIN/GA/SA/SV = суммы, Sv%/GAA = средние значения

Процесс Export Season:
1. Ввести Goal Value для соперника (звёзды 0.5–5.0)
2. Ввести время на льду вратарей (ММ:СС; пусто или 0 = не играл)
3. Обе таблицы (полевые + вратари) обновляются`,

            sv: `📊 Season

På Season-sidan ser du den ackumulerade statistiken för alla matcher du har lagt till via „Export Season". Använd toggleknappen högst upp („Goalies" / „Players") för att växla mellan spelartabellen och målvaktstabellen.

Hantering (spelartabell):
• Klick / dubbelklick på värden: +1 / –1 (för +/- även negativt)
• Långtryck på tidcell: ange tid manuellt
• Positionsfilter (dropdown „Pos."): C, LW, RW, D
• Klicka på kolumnrubrik: sortering stigande/fallande

🏒 Player Stats — Förkortningar
• Games — antal spelade matcher
• Goals — gjorda mål
• Assists — målgivande passningar
• Points — Goals + Assists
• +/- — Plus/Minus: mål för mot mål emot det egna laget under spelarens istid
• Ø +/- — genomsnittligt +/- per match
• Shots — skott på mål
• Shots/Game — skott per match
• Shots % — träffprocent: Goals ÷ Shots (effektivitet framför mål)
• Goals/Game — mål per match
• Points/Game — poäng per match (poängtakt)
• Penalty — utvisningsminuter
• Goal Value — viktad målkvalitet (mål mot starka motståndare väger tyngre, se sidan Goal Value)
• FaceOffs — tekningar totalt
• FaceOffs Won — vunna tekningar
• FaceOffs % — tekningsprocent
• SF/min — skott för per minuts istid: lagets skott för oss under spelarens istid (mäter offensiv linjenärvaro)
• SA/min — skott mot per minuts istid: lagets skott mot oss under spelarens istid (lägre är bättre — defensiv närvaro)
• Shot Share % — puckinnehavsmått (Corsi-liknande): andel egna skott av alla skott under istiden; > 50% = laget dominerar när spelaren är på is
• MVP — plats i MVP-rankning (1 = värdefullaste spelare)
• MVP Points — MVP-formelpoäng (AI-baserad: mål, assists, +/-, Shots %, Goal Value, istid)

Tolkning:
• Points/Game och Shots % visar individuell klass
• +/- och Ø +/- visar tvåvägs-spel och lagbidrag
• Goal Value bedömer mot vem målen gjordes
• MVP Points kombinerar allt till ett samlat betyg
• SF/min, SA/min och Shot Share % visar lagets effekt under spelarens istid (oberoende av om spelaren själv skjuter eller gör mål)

🥅 Goalie Stats — Förkortningar
Växla via knappen „Goalies" uppe till höger.
• Games — matcher målvakten spelade
• MIN — spelade minuter (MM:SS)
• GA — Goals Against: insläppta mål
• SA — Shots Against: skott mot mål
• SV — Saves: räddningar (SA – GA)
• Sv% — Save Percentage: SV ÷ SA (högre är bättre; elit ≥ 92%)
• GAA — Goals Against Average: insläppta mål per 60 minuter (lägre är bättre; elit ≤ 2.00)
• SO — Shutouts: matcher utan insläppt mål
• Goal Value — inverterad motståndarsviktning: mål mot svaga motståndare straffas hårdare
• MVP — plats i målvakt-MVP-rankning
• MVP Points — Sv% × istidskonfidens – Goal Value/match + spelbonus

Tolkning:
• Sv% är det viktigaste nyckeltalet för målvakter
• GAA kompletterar Sv% (tar även hänsyn till hur många skott som passerar)
• SO lyfter fram topprestationer
• Totalrad: MIN/GA/SA/SV = summor, Sv%/GAA = genomsnitt

Export Season-flöde:
1. Ange Goal Value för motståndaren (stjärnor 0.5–5.0)
2. Ange målvakternas istid (MM:SS; tomt eller 0 = spelade ej)
3. Båda tabellerna (skridskospelare + målvakter) uppdateras`,

            fi: `📊 Season

Season-sivulla näet kaikkien pelien kumulatiiviset tilastot, jotka olet lisännyt „Export Season" -toiminnolla. Käytä yläosan vaihtonappulaa („Goalies" / „Players") vaihtaaksesi pelaajataulukon ja maalivahtitaulukon välillä.

Käyttö (pelaajataulukko):
• Klikkaus / tuplaklikkaus arvoihin: +1 / –1 (myös negatiivinen +/-:lle)
• Pitkä painallus aikasoluun: syötä aika manuaalisesti
• Pelipaikkasuodatin (pudotusvalikko „Pos."): C, LW, RW, D
• Sarakeotsikoiden klikkaus: lajittelu nousevasti/laskevasti

🏒 Player Stats — Lyhenteet
• Games — pelattujen pelien määrä
• Goals — tehdyt maalit
• Assists — syötöt (maalinsyötöt)
• Points — Goals + Assists
• +/- — Plus/Miinus: omat maalit vs. vastustajan maalit pelaajan jääaikana
• Ø +/- — keskimääräinen +/- per peli
• Shots — laukaukset maalille
• Shots/Game — laukaukset per peli
• Shots % — osumisprosentti: Goals ÷ Shots (tehokkuus maalin edessä)
• Goals/Game — maalit per peli
• Points/Game — pisteet per peli (pisteiden keräämistahti)
• Penalty — jäähy­minuutit
• Goal Value — painotettu maalien laatu (maalit vahvoja vastustajia vastaan arvokkaampia, ks. Goal Value -sivu)
• FaceOffs — aloitukset yhteensä
• FaceOffs Won — voitetut aloitukset
• FaceOffs % — aloitusprosentti
• SF/min — laukaukset puolesta per jääaikaminuutti: joukkueen laukaukset puolestamme pelaajan jääaikana (mittaa hyökkäyslinjan läsnäoloa)
• SA/min — laukaukset vastaan per jääaikaminuutti: joukkueen laukaukset meitä vastaan pelaajan jääaikana (alempi on parempi — puolustava läsnäolo)
• Shot Share % — kiekonhallintamittari (Corsi-tyyppinen): omien laukausten osuus kaikista laukauksista jääaikana; > 50% = joukkue hallitsee peliä pelaajan ollessa jäällä
• MVP — sija MVP-rankingissa (1 = arvokkain pelaaja)
• MVP Points — MVP-kaavan pisteet (tekoälypohjainen: maalit, syötöt, +/-, Shots %, Goal Value, jääaika)

Tulkinta:
• Points/Game ja Shots % osoittavat yksilöllisen tason
• +/- ja Ø +/- kuvaavat kahden suunnan peliä ja joukkuepanosta
• Goal Value arvioi, keitä vastaan maalit tehtiin
• MVP Points yhdistää kaiken yhteen kokonaisarviointiin
• SF/min, SA/min ja Shot Share % osoittavat joukkuevaikutuksen pelaajan jääaikana (riippumatta siitä, laukooko tai tekeekö hän itse maalin)

🥅 Goalie Stats — Lyhenteet
Vaihda „Goalies"-painikkeella oikeassa yläkulmassa.
• Games — pelit, joissa maalivahti pelasi
• MIN — pelatut minuutit (MM:SS)
• GA — Goals Against: päästetyt maalit
• SA — Shots Against: laukaukset maalille
• SV — Saves: torjunnat (SA – GA)
• Sv% — Save Percentage: SV ÷ SA (korkeampi on parempi; eliitti ≥ 92%)
• GAA — Goals Against Average: päästetyt maalit per 60 minuuttia (alempi on parempi; eliitti ≤ 2.00)
• SO — Shutouts: pelit ilman päästettyä maalia
• Goal Value — käänteinen vastustajapainotus: maalit heikkoja vastustajia vastaan rankaisevat enemmän
• MVP — sija maalivahti-MVP-rankingissa
• MVP Points — Sv% × jääaikavarmuus – Goal Value/peli + peluutusbonus

Tulkinta:
• Sv% on tärkein yksittäinen tunnusluku maalivahdille
• GAA täydentää Sv%:ia (ottaa huomioon myös laukausten läpäisymäärän)
• SO korostaa huipputuloksia
• Yhteensä-rivi: MIN/GA/SA/SV = summat, Sv%/GAA = keskiarvot

Export Season -kulku:
1. Anna Goal Value vastustajalle (tähdet 0.5–5.0)
2. Anna maalivahtien jääaika (MM:SS; tyhjä tai 0 = ei pelannut)
3. Molemmat taulukot (luistelijat + maalivahdit) päivitetään`,

            fr: `📊 Season

La page Season affiche les statistiques cumulées de tous les matches ajoutés via « Export Season ». Le bouton toggle en haut (« Goalies » / « Players ») permet de basculer entre le tableau des patineurs et celui des gardiens.

Utilisation (tableau des joueurs) :
• Clic / double-clic sur les valeurs : +1 / –1 (pour +/- aussi négatif)
• Appui long sur la cellule de temps : saisir le temps manuellement
• Filtre de position (liste déroulante « Pos. ») : C, LW, RW, D
• Cliquer sur l'en-tête de colonne : tri croissant/décroissant

🏒 Player Stats — Abréviations
• Games — nombre de matches joués
• Goals — buts marqués
• Assists — passes décisives
• Points — Goals + Assists
• +/- — Plus/Minus : buts pour vs. contre ton équipe pendant le temps de glace du joueur
• Ø +/- — +/- moyen par match
• Shots — tirs cadrés
• Shots/Game — tirs par match
• Shots % — pourcentage de tirs : Goals ÷ Shots (efficacité devant le but)
• Goals/Game — buts par match
• Points/Game — points par match (rythme de production)
• Penalty — minutes de pénalité
• Goal Value — qualité pondérée des buts (les buts contre des adversaires forts comptent davantage, voir la page Goal Value)
• FaceOffs — mises en jeu au total
• FaceOffs Won — mises en jeu remportées
• FaceOffs % — pourcentage de mises en jeu gagnées
• SF/min — tirs pour par minute de temps de glace : tirs de l'équipe en notre faveur pendant le temps de glace du joueur (mesure la présence offensive de la ligne)
• SA/min — tirs contre par minute de temps de glace : tirs de l'équipe contre nous pendant le temps de glace du joueur (plus c'est bas, mieux c'est — présence défensive)
• Shot Share % — indicateur de possession (style Corsi) : part des tirs propres parmi tous les tirs pendant le temps de glace ; > 50% = l'équipe domine quand ce joueur est sur la glace
• MVP — rang dans le classement MVP (1 = joueur le plus précieux)
• MVP Points — score de la formule MVP (IA : buts, assists, +/-, Shots %, Goal Value, temps de glace)

Interprétation :
• Points/Game et Shots % révèlent la classe individuelle
• +/- et Ø +/- montrent le jeu dans les deux sens et la contribution à l'équipe
• Goal Value évalue contre qui les buts ont été marqués
• MVP Points combine tout en une évaluation globale
• SF/min, SA/min et Shot Share % montrent l'effet d'équipe pendant le temps de glace du joueur (indépendamment du fait qu'il tire ou marque lui-même)

🥅 Goalie Stats — Abréviations
Basculer via le bouton « Goalies » en haut à droite.
• Games — matches dans lesquels le gardien a joué
• MIN — minutes jouées (MM:SS)
• GA — Goals Against : buts encaissés
• SA — Shots Against : tirs cadrés
• SV — Saves : arrêts effectués (SA – GA)
• Sv% — Save Percentage : SV ÷ SA (plus c'est élevé, mieux c'est ; élite ≥ 92%)
• GAA — Goals Against Average : buts encaissés par 60 minutes (plus c'est bas, mieux c'est ; élite ≤ 2.00)
• SO — Shutouts : matches sans but encaissé
• Goal Value — pondération inversée des adversaires : les buts contre des adversaires faibles sont davantage pénalisés
• MVP — rang dans le classement MVP des gardiens
• MVP Points — Sv% × fiabilité du temps de glace – Goal Value/match + bonus de titularisation

Interprétation :
• Sv% est l'indicateur clé le plus important pour un gardien
• GAA complète Sv% (tient compte du nombre de tirs qui passent)
• SO met en valeur les meilleures performances
• Ligne Total : MIN/GA/SA/SV = sommes, Sv%/GAA = moyennes

Processus Export Season :
1. Saisir le Goal Value de l'adversaire (étoiles 0.5–5.0)
2. Saisir le temps de glace des gardiens (MM:SS ; vide ou 0 = n'a pas joué)
3. Les deux tableaux (patineurs + gardiens) sont mis à jour`
        },
        
        'game-center': {
            de: `🏒 Game Center

Spielerzeile:
• Klick auf Namen (nicht auf ⋮⋮): Timer Start/Stop für jeden Spieler. Die 5 Spieler mit grünen Werten haben die längste Eiszeit, die 5 Spieler mit roten Werten haben die niedrigste Eiszeit.
• Klick auf Zeit: +10 s; Doppelklick: –10 s.
• Langer Druck auf ⋮⋮ → Drag & Drop für Reihenfolge

Statistikzellen (z. B. Goals, Shot):
• Klick: +1, Doppelklick: –1.
• Bei +1 auf Goals/Shot startet je nach Ereignis der Goal- bzw. Shot-Workflow in der Goal Map.
• Gegner-Schüsse: In der Shot-Totals-Zelle (unten) per Klick/Doppelklick zählen.

Download: Spieldaten werden als Excel heruntergeladen.

Export Season: Spieldaten werden zu Saisonstatistiken addiert. Dabei werden Sie gebeten, einen Goal Value Wert einzugeben. Bsp: 1 Stern = sehr schwacher Gegner, einfach Tore zu erzielen, Gegner am untersten Tabellen Ende, Chance auf viele Schüsse. 10 Sterne = Sehr starker Gegner, Tabellen Leader, Schwer Chancen zu bekommen, eher weniger Schüsse zugelassen.

Mit Button (☀️/🌙) kann zwischen Light- und Dark Mode gewechselt werden.

📤 Ablauf beim Export Season:
1. Goal Value für den Gegner eingeben (Sterne 0.5–5.0)
2. Spielzeit der Goalies eingeben (MM:SS; leer oder 0 = nicht gespielt)
3. Beide Tabellen (Skater + Goalie) werden aktualisiert`,
            
            en: `🏒 Game Center

Player Row:
• Click on name (not on ⋮⋮): Timer Start/Stop for each player. The 5 players with green values have the longest ice time, the 5 players with red values have the lowest ice time.
• Click on time: +10 s; Double-click: –10 s.
• Long press on ⋮⋮ → Drag & Drop for order

Statistic Cells (e.g. Goals, Shot):
• Click: +1, Double-click: –1.
• When +1 on Goals/Shot, the Goal or Shot workflow starts in the Goal Map depending on the event.
• Opponent shots: Count in the Shot-Totals cell (bottom) via click/double-click.

Download: Game data is downloaded as Excel.

Export Season: Game data is added to season statistics. You will be asked to enter a Goal Value. Example: 1 star = very weak opponent, easy to score goals, opponent at the bottom of the table, chance for many shots. 10 stars = Very strong opponent, table leader, hard to get chances, fewer shots allowed.

With button (☀️/🌙) you can switch between Light and Dark Mode.

📤 Export Season workflow:
1. Enter Goal Value for the opponent (stars 0.5–5.0)
2. Enter goalie ice time (MM:SS; leave blank or 0 = did not play)
3. Both tables (skaters + goalies) are updated`,
            
            ru: `🏒 Game Center

Строка игрока:
• Клик по имени (не по ⋮⋮): Старт/Стоп таймера для каждого игрока. 5 игроков с зелёными значениями имеют наибольшее время на льду, 5 игроков с красными значениями — наименьшее.
• Клик по времени: +10 с; Двойной клик: –10 с.
• Долгое нажатие на ⋮⋮ → Перетаскивание для изменения порядка

Ячейки статистики (напр. Goals, Shot):
• Клик: +1, Двойной клик: –1.
• При +1 на Goals/Shot запускается соответствующий процесс в Goal Map.
• Броски соперника: Считать в ячейке Shot-Totals (внизу) кликом/двойным кликом.

Download: Данные игры скачиваются в Excel.

Export Season: Данные игры добавляются к сезонной статистике. Вас попросят ввести Goal Value. Пример: 1 звезда = очень слабый соперник, 10 звёзд = очень сильный соперник.

Кнопкой (☀️/🌙) можно переключаться между светлым и тёмным режимом.

📤 Процесс Export Season:
1. Ввести Goal Value для соперника (звёзды 0.5–5.0)
2. Ввести время на льду вратарей (ММ:СС; пусто или 0 = не играл)
3. Обе таблицы (полевые + вратари) обновляются`,
            
            sv: `🏒 Game Center

Spelarrad:
• Klick på namn (inte på ⋮⋮): Timer Start/Stopp för varje spelare. De 5 spelarna med gröna värden har längst istid, de 5 spelarna med röda värden har lägst istid.
• Klick på tid: +10 s; Dubbelklick: –10 s.
• Långt tryck på ⋮⋮ → Drag & Drop för ordning

Statistikceller (t.ex. Goals, Shot):
• Klick: +1, Dubbelklick: –1.
• Vid +1 på Goals/Shot startar Goal- eller Shot-arbetsflödet i Goal Map.
• Motståndarskott: Räkna i Shot-Totals-cellen (nere) via klick/dubbelklick.

Download: Speldata laddas ner som Excel.

Export Season: Speldata läggs till säsongsstatistik. Du kommer att bli ombedd att ange ett Goal Value. Exempel: 1 stjärna = mycket svag motståndare, 10 stjärnor = mycket stark motståndare.

Med knappen (☀️/🌙) kan du växla mellan ljust och mörkt läge.

📤 Export Season-flöde:
1. Ange Goal Value för motståndaren (stjärnor 0.5–5.0)
2. Ange målvakternas istid (MM:SS; tomt eller 0 = spelade ej)
3. Båda tabellerna (skridskospelare + målvakter) uppdateras`,
            
            fi: `🏒 Game Center

Pelaajarivi:
• Klikkaa nimeä (ei ⋮⋮): Ajastin Start/Stop jokaiselle pelaajalle. 5 pelaajaa vihreillä arvoilla ovat eniten jäällä, 5 pelaajaa punaisilla arvoilla vähiten.
• Klikkaa aikaa: +10 s; Tuplaklikkaus: –10 s.
• Pitkä painallus ⋮⋮ → Vedä ja pudota järjestyksen muuttamiseksi

Tilastosolut (esim. Goals, Shot):
• Klikkaus: +1, Tuplaklikkaus: –1.
• +1 Goals/Shot käynnistää Goal- tai Shot-työnkulun Goal Mapissa.
• Vastustajan laukaukset: Laske Shot-Totals-solussa (alhaalla) klikkauksella/tuplaklikkauksella.

Download: Pelitiedot ladataan Excelinä.

Export Season: Pelitiedot lisätään kauden tilastoihin. Sinua pyydetään syöttämään Goal Value. Esimerkki: 1 tähti = erittäin heikko vastustaja, 10 tähteä = erittäin vahva vastustaja.

Painikkeella (☀️/🌙) voit vaihtaa vaalean ja tumman tilan välillä.

📤 Export Season -kulku:
1. Anna Goal Value vastustajalle (tähdet 0.5–5.0)
2. Anna maalivahtien jääaika (MM:SS; tyhjä tai 0 = ei pelannut)
3. Molemmat taulukot (luistelijat + maalivahdit) päivitetään`,
            
            fr: `🏒 Game Center

Ligne du joueur:
• Clic sur le nom (pas sur ⋮⋮): Démarrer/Arrêter le chrono pour chaque joueur. Les 5 joueurs avec des valeurs vertes ont le plus de temps de glace, les 5 joueurs avec des valeurs rouges ont le moins.
• Clic sur le temps: +10 s; Double-clic: –10 s.
• Appui long sur ⋮⋮ → Glisser-déposer pour l'ordre

Cellules statistiques (p.ex. Goals, Shot):
• Clic: +1, Double-clic: –1.
• Lors de +1 sur Goals/Shot, le workflow Goal ou Shot démarre dans Goal Map.
• Tirs adverses: Compter dans la cellule Shot-Totals (en bas) via clic/double-clic.

Download: Les données du match sont téléchargées en Excel.

Export Season: Les données du match sont ajoutées aux statistiques de saison. On vous demandera d'entrer une valeur Goal Value. Ex: 1 étoile = adversaire très faible, 10 étoiles = adversaire très fort.

Avec le bouton (☀️/🌙) vous pouvez basculer entre le mode clair et sombre.

📤 Processus Export Season :
1. Saisir le Goal Value de l'adversaire (étoiles 0.5–5.0)
2. Saisir le temps de glace des gardiens (MM:SS ; vide ou 0 = n'a pas joué)
3. Les deux tableaux (patineurs + gardiens) sont mis à jour`
        },
        
        'goal-value': {
            de: `📈 Goal Value

Dieser Wert wird für die Saisonstatistiken benötigt.
Manuelle Eingabe der erzielten Tore gegen den jeweiligen Gegner möglich.
Untere Skala (Bottom) gewichtet Gegnerstärke; Value = Summe (Wert × Gewicht). Dieser Wert zeigt einen Mittelwert aller exportierten Werte für diesen Gegner an, kann manuell angepasst werden.
Reset setzt alle Werte, Skalen und Gegnernamen zurück.`,
            
            en: `📈 Goal Value

• This value is required for season statistics
• Manual entry of goals scored against each opponent
• Bottom scale weights opponent strength; Value = Sum (value × weight).
• Reset clears all values, scales, and opponent names.`,
            
            ru: `📈 Goal Value

• Это значение необходимо для сезонной статистики
• Ручной ввод забитых голов против каждого соперника
• Нижняя шкала (Bottom) весит силу соперника; Value = Сумма (значение × вес).
• Reset сбрасывает все значения, шкалы и имена соперников.`,
            
            sv: `📈 Goal Value

• Detta värde behövs för säsongsstatistik
• Manuell inmatning av gjorda mål mot varje motståndare
• Nedre skala (Bottom) viktar motståndares styrka; Value = Summa (värde × vikt).
• Reset återställer alla värden, skalor och motståndarnamn.`,
            
            fi: `📈 Goal Value

• Tämä arvo tarvitaan kauden tilastoihin
• Manuaalinen syöttö tehdyistä maaleista kutakin vastustajaa vastaan
• Alaskala (Bottom) painottaa vastustajan vahvuutta; Value = Summa (arvo × paino).
• Reset nollaa kaikki arvot, asteikot ja vastustajien nimet`,
            
            fr: `📈 Goal Value

Cette valeur est nécessaire pour les statistiques de la saison.
Saisie manuelle des buts marqués contre chaque adversaire.
L'échelle inférieure (Bottom) pèse la force de l'adversaire; Value = Somme (valeur × poids). Cette valeur montre une moyenne de toutes les valeurs exportées pour cet adversaire, peut être ajustée manuellement.
Reset efface toutes les valeurs, les échelles et les noms des adversaires.`
        },
        
        'goal-map': {
            de: `🎯 Goal Map / Torbild

Feldhälften: Grün/Oben = scored / Rot/Unten = conceded

Goal-Workflow (Beginnt mit Klick auf Goal in Game Center):
• 1. Grauen Punkt in grüne Spielhälfte setzen
• 2. Punkt in grünes Tor setzen
• 3. Zeit bestimmen in grünen Time-Buttons
• Danach Auto-Return zu Game Center.

Shot-Workflow (Beginnt mit Klick auf Shot in Game Center):
• 1. Grünen Punkt in grüne Spielhälfte setzen
• Danach Auto-Return zu Game Center.

Goal erhalten (es muss ein Goalie oben ausgewählt werden):
• 1. Grauen Punkt in rote Spielhälfte setzen
• 2. Punkt in rotes Tor setzen
• 3. Zeit bestimmen in roten Time-Buttons

Time Buttons:
• Klick: +1, Doppelklick: -1
• WICHTIG: +1/-1 gilt nur für den aktuell ausgewählten Spieler im Filter
• Ohne Filter wird "anonymous" verwendet
• Der angezeigte Wert ist die SUMME aller Spieler
• Um einen bestimmten Spieler zu korrigieren, wähle ihn zuerst im Filter aus und korrigiere per Klick auf Punkt (im Spielfeld und Tor) oder per Doppelklick (Time Buttons)

Export Season Map: Punkte werden zu Season Map addiert`,
            
            en: `🎯 Goal Map

Field Halves: Green/Top = scored / Red/Bottom = conceded

Goal Workflow (Starts with click on Goal in Game Center):
• 1. Place gray dot in green field half
• 2. Place dot in green goal
• 3. Determine time in green Time Buttons
• Then auto-return to Game Center.

Shot Workflow (Starts with click on Shot in Game Center):
• 1. Place green dot in green field half
• Then auto-return to Game Center.

Goal conceded (a goalie must be selected at the top):
• 1. Place gray dot in red field half
• 2. Place dot in red goal
• 3. Determine time in red Time Buttons

Time Buttons:
• Click: +1, Double-click: -1
• IMPORTANT: +1/-1 applies only to the currently selected player in the filter
• Without filter "anonymous" is used
• The displayed value is the SUM of all players
• To correct a specific player, first select them in the filter and correct by clicking on dots (in field and goal) or by double-clicking (Time Buttons)

Export Season Map: Dots are added to Season Map`,
            
            ru: `🎯 Goal Map

Половины поля: Зелёный/Верх = забито / Красный/Низ = пропущено

Goal-Workflow (Начинается с клика на Goal в Game Center):
• 1. Поставить серую точку в зелёную половину поля
• 2. Поставить точку в зелёные ворота
• 3. Определить время в зелёных Time-Buttons
• Затем авто-возврат в Game Center.

Shot-Workflow (Начинается с клика на Shot в Game Center):
• 1. Поставить зелёную точку в зелёную половину поля
• Затем авто-возврат в Game Center.

Пропущенный гол (вратарь должен быть выбран вверху):
• 1. Поставить серую точку в красную половину поля
• 2. Поставить точку в красные ворота
• 3. Определить время в красных Time-Buttons

Time Buttons:
• Клик: +1, Двойной клик: -1
• ВАЖНО: +1/-1 применяется только к выбранному игроку в фильтре
• Без фильтра используется "anonymous"
• Отображаемое значение - это СУММА всех игроков
• Чтобы исправить конкретного игрока, сначала выберите его в фильтре и исправьте кликом на точку (на поле и в воротах) или двойным кликом (Time Buttons)

Export Season Map: Точки добавляются к Season Map`,
            
            sv: `🎯 Goal Map

Fälthalvor: Grön/Övre = gjorda / Röd/Nedre = insläppta

Goal-Workflow (Börjar med klick på Goal i Game Center):
• 1. Placera grå punkt i grön fälthälft
• 2. Placera punkt i grönt mål
• 3. Bestäm tid i gröna Time-Buttons
• Sedan auto-återgång till Game Center.

Shot-Workflow (Börjar med klick på Shot i Game Center):
• 1. Placera grön punkt i grön fälthälft
• Sedan auto-återgång till Game Center.

Insläppt mål (en målvakt måste väljas överst):
• 1. Placera grå punkt i röd fälthälft
• 2. Placera punkt i rött mål
• 3. Bestäm tid i röda Time-Buttons

Time Buttons:
• Klick: +1, Dubbelklick: -1
• VIKTIGT: +1/-1 gäller endast för den valda spelaren i filtret
• Utan filter används "anonymous"
• Det visade värdet är SUMMAN av alla spelare
• För att korrigera en specifik spelare, välj dem först i filtret och korrigera genom att klicka på punkt (i fält och mål) eller genom dubbelklick (Time Buttons)

Export Season Map: Punkter läggs till Season Map`,
            
            fi: `🎯 Goal Map

Kenttäpuoliskot: Vihreä/Ylä = tehty / Punainen/Ala = päästetty

Goal-Workflow (Alkaa klikkauksella Goal Game Centerissä):
• 1. Aseta harmaa piste vihreälle kenttäpuoliskolle
• 2. Aseta piste vihreään maaliin
• 3. Määritä aika vihreissä Time-Buttons
• Sitten automaattinen paluu Game Centeriin.

Shot-Workflow (Alkaa klikkauksella Shot Game Centerissä):
• 1. Aseta vihreä piste vihreälle kenttäpuoliskolle
• Sitten automaattinen paluu Game Centeriin.

Päästetty maali (maalivahti on valittava yläosasta):
• 1. Aseta harmaa piste punaiselle kenttäpuoliskolle
• 2. Aseta piste punaiseen maaliin
• 3. Määritä aika punaisissa Time-Buttons

Time Buttons:
• Klikkaus: +1, Tuplaklikkaus: -1
• TÄRKEÄÄ: +1/-1 koskee vain suodattimessa valittua pelaajaa
• Ilman suodatinta käytetään "anonymous"
• Näytetty arvo on SUMMA kaikista pelaajista
• Korjataksesi tiettyä pelaajaa, valitse heidät ensin suodattimesta ja korjaa klikkaamalla pistettä (kentällä ja maalissa) tai tuplaklikkaamalla (Time Buttons)

Export Season Map: Pisteet lisätään Season Mapiin`,
            
            fr: `🎯 Goal Map

Moitiés de terrain: Vert/Haut = marqués / Rouge/Bas = encaissés

Flux Goal (Commence avec clic sur Goal dans Game Center):
• 1. Placer le point gris dans la moitié de terrain verte
• 2. Placer le point dans le but vert
• 3. Déterminer le temps dans les boutons Time verts
• Puis retour automatique à Game Center.

Flux Shot (Commence avec clic sur Shot dans Game Center):
• 1. Placer le point vert dans la moitié de terrain verte
• Puis retour automatique à Game Center.

But encaissé (un gardien doit être sélectionné en haut):
• 1. Placer le point gris dans la moitié de terrain rouge
• 2. Placer le point dans le but rouge
• 3. Déterminer le temps dans les boutons Time rouges

Boutons Time:
• Clic: +1, Double-clic: -1
• IMPORTANT: +1/-1 s'applique uniquement au joueur actuellement sélectionné dans le filtre
• Sans filtre "anonymous" est utilisé
• La valeur affichée est la SOMME de tous les joueurs
• Pour corriger un joueur spécifique, sélectionnez-le d'abord dans le filtre et corrigez en cliquant sur les points (sur le terrain et le but) ou en double-cliquant (boutons Time)

Export Season Map: Les points sont ajoutés à Season Map`
        },
        
        'season-map': {
            de: `🗺️ Season Map

• Only read

Filter:
• Player-Filter: Zeigt/aggregiert grüne (scored) Werte nur für diesen Spieler.
• Goalie-Filter: Zeigt/aggregiert rote (conceded) Werte nur für diesen Goalie.

Momentum-Grafik:
• Mit Player-Filter: grüne Werte nur dieses Spielers.
• Mit Goalie-Filter: rote Werte nur dieses Goalies.
• Ohne Filter: Gesamtwerte.`,
            
            en: `🗺️ Season Map

• Read only

Filters:
• Player Filter: Shows/aggregates green (scored) values for this player only.
• Goalie Filter: Shows/aggregates red (conceded) values for this goalie only.

Momentum Chart:
• With Player Filter: green values of this player only.
• With Goalie Filter: red values of this goalie only.
• Without filter: Total values.`,
            
            ru: `🗺️ Season Map

• Только просмотр

Фильтры:
• Player Filter: Показывает/суммирует зелёные (забитые) значения только для этого игрока.
• Goalie Filter: Показывает/суммирует красные (пропущенные) значения только для этого вратаря.

Momentum-график:
• С Player Filter: зелёные значения только этого игрока.
• С Goalie Filter: красные значения только этого вратаря.
• Без фильтра: Общие значения.`,
            
            sv: `🗺️ Season Map

• Endast läsning

Filter:
• Player Filter: Visar/aggregerar gröna (gjorda) värden endast för denna spelare.
• Goalie Filter: Visar/aggregerar röda (insläppta) värden endast för denna målvakt.

Momentum-graf:
• Med Player Filter: gröna värden endast för denna spelare.
• Med Goalie Filter: röda värden endast för denna målvakt.
• Utan filter: Totalvärden.`,
            
            fi: `🗺️ Season Map

• Vain luku

Suodattimet:
• Player Filter: Näyttää/kokoaa vihreät (tehdyt) arvot vain tälle pelaajalle.
• Goalie Filter: Näyttää/kokoaa punaiset (päästetyt) arvot vain tälle maalivahdille.

Momentum-kaavio:
• Player Filterin kanssa: vihreät arvot vain tämän pelaajan.
• Goalie Filterin kanssa: punaiset arvot vain tämän maalivahdin.
• Ilman suodatinta: Kokonaisarvot.`,
            
            fr: `🗺️ Season Map

• Lecture seule

Filtres:
• Player Filter: Affiche/agrège les valeurs vertes (marqués) uniquement pour ce joueur.
• Goalie Filter: Affiche/agrège les valeurs rouges (encaissés) uniquement pour ce gardien.

Graphique Momentum:
• Avec Player Filter: valeurs vertes uniquement de ce joueur.
• Avec Goalie Filter: valeurs rouges uniquement de ce gardien.
• Sans filtre: Valeurs totales.`
        }
    };
    
    const closeButtonText = {
        de: 'Schließen',
        en: 'Close',
        ru: 'Закрыть',
        sv: 'Stäng',
        fi: 'Sulje',
        fr: 'Fermer'
    };
    
    function detectCurrentPage(titleElement) {
        // Detect which page based on title text or parent container
        const text = titleElement.textContent.toLowerCase().trim();
        
        // Check parent page container
        const pageContainer = titleElement.closest('.page');
        if (pageContainer) {
            const pageId = pageContainer.id;
            if (pageId === 'teamSelectionPage') return 'team-selection';
            if (pageId === 'playerSelectionPage') return 'player-selection';
            if (pageId === 'lineUpPage') return 'line-up';
            if (pageId === 'seasonPage') return 'season';
            if (pageId === 'statsPage') return 'game-center';
            if (pageId === 'goalValuePage') return 'goal-value';
            if (pageId === 'torbildPage') return 'goal-map';
            if (pageId === 'seasonMapPage') return 'season-map';
        }
        
        // Fallback to text matching
        if (text.includes('team')) return 'team-selection';
        if (text.includes('player')) return 'player-selection';
        if (text.includes('season') && (text.includes('table') || text.includes('saison'))) return 'season';
        if (text.includes('game center')) return 'game-center';
        if (text.includes('goal value')) return 'goal-value';
        if (text.includes('goal map') || text.includes('torbild')) return 'goal-map';
        if (text.includes('season map')) return 'season-map';
        if (text.includes('season')) return 'season';
        
        return 'team-selection';
    }
    
    function convertMarkdownToHTML(markdown) {
        // Split by double newlines to get paragraphs
        const lines = markdown.split('\n');
        let html = '';
        let currentList = null;
        let listType = null;
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            if (!line) {
                // Close any open list on empty line
                if (currentList) {
                    html += `</${listType}>`;
                    currentList = null;
                    listType = null;
                }
                continue;
            }
            
            // Check for bullet list (• or - at start)
            const bulletMatch = line.match(/^[•\-]\s+(.+)$/);
            if (bulletMatch) {
                if (!currentList || listType !== 'ul') {
                    if (currentList) html += `</${listType}>`;
                    html += '<ul>';
                    currentList = [];
                    listType = 'ul';
                }
                html += `<li>${bulletMatch[1].replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>`;
                continue;
            }
            
            // Check for numbered list (1. 2. 3. etc.)
            const numberedMatch = line.match(/^(\d+)\.\s+(.+)$/);
            if (numberedMatch) {
                if (!currentList || listType !== 'ol') {
                    if (currentList) html += `</${listType}>`;
                    html += '<ol>';
                    currentList = [];
                    listType = 'ol';
                }
                html += `<li>${numberedMatch[2].replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>`;
                continue;
            }
            
            // Close any open list before processing non-list items
            if (currentList) {
                html += `</${listType}>`;
                currentList = null;
                listType = null;
            }
            
            // Check if line looks like a section title (contains emoji or is all caps)
            if (line.match(/^[🎯📊📈🏒👥🗺️📋💡🆕🥅📤]/)) {
                html += `<h2 class="info-section-title">${line}</h2>`;
            } else {
                // Regular paragraph
                html += `<p>${line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>`;
            }
        }
        
        // Close any remaining list
        if (currentList) {
            html += `</${listType}>`;
        }
        
        return html;
    }
    
    function showPageSpecificInfo(page) {
        // Get saved language or default to German
        const savedLanguage = AppStorage.getItem('infoLanguage') || 'de';
        const lang = savedLanguage;
        const info = pageInfos[page]?.[lang] || pageInfos[page]?.['de'] || 'Info nicht verfügbar';
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'info-modal';
        
        modal.innerHTML = `
            <div class="info-content">
                <div class="info-language-selector">
                    <select id="pageInfoLanguageSelect">
                        <option value="de">&#x1F1E9;&#x1F1EA; Deutsch</option>
                        <option value="en">&#x1F1FA;&#x1F1F8; English</option>
                        <option value="ru">&#x1F1F7;&#x1F1FA; Русский</option>
                        <option value="sv">&#x1F1F8;&#x1F1EA; Svenska</option>
                        <option value="fi">&#x1F1EB;&#x1F1EE; Suomi</option>
                        <option value="fr">&#x1F1EB;&#x1F1F7; Français</option>
                    </select>
                </div>
                ${convertMarkdownToHTML(info)}
                <button id="pageInfoCloseBtn" class="page-info-close-btn">${closeButtonText[lang] || closeButtonText.de}</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Set the saved language
        const languageSelect = document.getElementById('pageInfoLanguageSelect');
        if (languageSelect) {
            languageSelect.value = savedLanguage;
            
            // Language change event listener
            languageSelect.addEventListener('change', (e) => {
                const selectedLanguage = e.target.value;
                AppStorage.setItem('infoLanguage', selectedLanguage);
                modal.remove();
                showPageSpecificInfo(page); // Reload with new language
            });
        }
        
        // Close button event listener
        document.getElementById('pageInfoCloseBtn')?.addEventListener('click', () => {
            modal.remove();
        });
        
        // Close when clicking outside the modal content
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    function initPageTitleInfo() {
        // Make all page titles (h1 elements) clickable
        const pageTitles = document.querySelectorAll('.page h1');
        
        pageTitles.forEach(title => {
            // Add pointer cursor
            title.style.cursor = 'pointer';
            
            // Add click event listener
            title.addEventListener('click', () => {
                const page = detectCurrentPage(title);
                showPageSpecificInfo(page);
            });
        });
        
        console.log('Page title info initialized for', pageTitles.length, 'titles');
    }
    
    // Public API
    return {
        init: initPageTitleInfo,
        showPageSpecificInfo
    };
})();
