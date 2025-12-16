# 🍿 Mediathek: Die lokale Film und Seriendaatenbank

**Ein selbst gehostetes, modernes Medien-Frontend auf Basis von Node.js und TMDB.**


---

## 🌟 Übersicht

Dieses Projekt bietet eine elegante, selbst gehostete Lösung für Ihre lokale Film- und Seriensammlung. Das Frontend ist im modernen **"Dark Mode"** gestaltet und bietet eine hervorragende User Experience. 
Alle Metadaten (Poster, Beschreibungen, Trailer, Cast) werden automatisch über die TMDB-API abgerufen, basierend auf einer simplen CSV-Liste/Datenbank.

### Haupt-Features

* **Modernes Design:** Dunkles, aufgeräumtes Interface mit Fokus auf die Poster und Glassmorphismus-Effekte.
* **Optimiertes Grid:** Das Haupt-Grid ist auf eine feste Größe von **3x8 Einträgen (24 pro Seite)** optimiert, um eine hochwertige Darstellung der Poster zu gewährleisten.
* **Intelligente Pagination:** Die Seitennavigation wird dynamisch auf maximal 5 Seiten-Buttons um die aktuelle Seite begrenzt, um Layout-Probleme bei großen Sammlungen zu vermeiden.
* **Sammlungen:** Filme, die zu einer Collection gehören, werden gruppiert und als einzelne Sammlungs-Karte angezeigt.
* **Detaillierte Metadaten:** Anzeige von FSK, Ratings (TMDB/IMDb-Links) und Crew-Details in der Modal-Ansicht.
* **Serien-Tracking:** Im Detail-Modal für Serien können Episoden pro Staffel gelistet und ihr Status (`Vorhanden`/`Fehlt`) manuell verwaltet werden.
* **Einfache Navigation:** Sidebar-Navigation mit schnellen Filtern (`Filme`, `Serien`, `Alles`).

---

## ⚙️ Voraussetzungen

### 1. Technische Anforderungen

* **Node.js:** Version 20 oder höher (für lokalen Betrieb).
* **Docker & Docker Compose:** Empfohlen für den stabilen Serverbetrieb.

### 2. API-Schlüssel

Sie benötigen gültige API-Schlüssel für die Metadaten-Abfrage.

* **TMDB API Key** (The Movie Database)
* **OMDb API Key** (Optional, für zusätzliche Rating-Daten)

**Einrichtung in `server.js`:**

Öffnen Sie die Datei `server.js` und ersetzen Sie die Platzhalter in den Konfigurationsvariablen:

```javascript
// server.js
const API_KEY = '[IHR_TMDB_API_KEY]'; 
const OMDB_KEY = '[IHR_OMDB_API_KEY]'; // Optional
// ...

```

### 3\. Benutzerverwaltung

Der Admin-Login wird über die Datei `users.json` verwaltet. Erstellen Sie diese Datei und definieren Sie mindestens einen Benutzer:

`users.json`

JSON

```code-container
[
  {
    "username": "admin",
    "password": "IhrSicheresPasswort"
  }
]

```

## 💾 Datenbank-Management (Admin Panel)

Die Filmlisten werden über einfache CSV-ähnliche Einträge im Admin-Panel verwaltet.

### 1\. Struktur der Einträge

Die Listen werden im **"Manager & CSV"**\-Tab des Admin-Panels in die Textfelder eingegeben. Die Struktur ist: `Suchanfrage;TMDB-ID`

<table><tbody><tr><td><p><strong>Format</strong></p></td><td><p><strong>Beispiel</strong></p></td><td><p><strong>Auswirkung</strong></p></td></tr><tr><td><p><strong>Film Name</strong></p></td><td><p><code spellcheck="false">Interstellar</code></p></td><td><p>Server sucht automatisch beste TMDB-ID.</p></td></tr><tr><td><p><strong>Mit ID</strong></p></td><td><p><code spellcheck="false">Interstellar;157336</code></p></td><td><p><strong>Empfohlen.</strong> Erzwingt die Verwendung der exakten TMDB-ID.</p></td></tr><tr><td><p><strong>Entfernen</strong></p></td><td><p><code spellcheck="false">Unnötiger Film;0</code></p></td><td><p>Server entfernt den Eintrag nach dem nächsten <code spellcheck="false">Generieren</code>.</p></td></tr></tbody></table>

### 2\. Korrektur Center (Tab 2)

Dieser Bereich zeigt alle erfolgreich zugeordneten Einträge.

<table><tbody><tr><td><p><strong>Funktion</strong></p></td><td><p><strong>Beschreibung</strong></p></td></tr><tr><td><p><strong>X (Entfernen)</strong></p></td><td><p>Setzt die ID des Eintrags in der CSV auf <code spellcheck="false">0</code> (wird nach dem nächsten <code spellcheck="false">Generieren</code> ausgeblendet).</p></td></tr><tr><td><p><strong>Edit</strong></p></td><td><p>Öffnet ein Modal, um Metadaten (Poster-URL, Trailer-ID) manuell zu überschreiben.</p></td></tr><tr><td><p><strong>Dynamischer Button</strong></p></td><td><p>Der Button <strong>"⚠️ Jetzt Generieren"</strong> erscheint nach jeder Änderung und fordert zur Datenbank-Synchronisation auf.</p></td></tr></tbody></table>

### 3\. Fehlende Einträge (Tab 1, Rechte Spalte)

Hier werden alle Einträge gelistet, die nicht automatisch zugeordnet werden konnten.

<table><tbody><tr><td><p><strong>Funktion</strong></p></td><td><p><strong>Beschreibung</strong></p></td></tr><tr><td><p><strong>Manuelle Suche</strong></p></td><td><p>Manuelle Suche nach dem Film. Die Ergebnisse werden in einem <strong>mehrzeiligen Poster-Grid</strong> (ca. 10 Poster pro Zeile) angezeigt.</p></td></tr><tr><td><p><strong>Zuweisung</strong></p></td><td><p>Ein Klick auf das korrekte Poster ordnet die TMDB-ID dem CSV-Eintrag zu.</p></td></tr><tr><td><p><strong>Enter-Taste</strong></p></td><td><p>Die Suche kann im Eingabefeld bequem mit der <strong>Enter-Taste</strong> gestartet werden.</p></td></tr></tbody></table>
<br>
<br>
<br>
<br>


# 📚 Installations- und Inbetriebnahme-Anleitung

Dieses Dokument beschreibt die Schritte zur Installation und Inbetriebnahme Ihrer Mediathek.

## I. Vorbereitung (Für beide Varianten notwendig)

Bevor Sie die Installation starten, müssen Sie die API-Schlüssel in der zentralen Serverdatei hinterlegen:

1.  **Öffnen Sie die Datei** `server.js`**.**
    
2.  Ersetzen Sie die Platzhalter durch Ihre erhaltenen Schlüssel:
    

<table><tbody><tr><td><p><strong>Variable</strong></p></td><td><p><strong>Beschreibung</strong></p></td><td><p><strong>Platzhalter ersetzen durch</strong></p></td></tr><tr><td><p><code spellcheck="false">API_KEY</code></p></td><td><p>TMDB API-Key (Zugriff auf Filmdaten)</p></td><td><p><code spellcheck="false">[IHR_TMDB_API_KEY]</code></p></td></tr><tr><td><p><code spellcheck="false">OMDB_KEY</code></p></td><td><p>OMDb API-Key (Zur Ergänzung von Bewertungen)</p></td><td><p><code spellcheck="false">[IHR_OMDB_API_KEY]</code></p></td></tr></tbody></table>

### Optional: Standardbenutzer anlegen

Der Admin-Login erfolgt über die Datei `users.json`. Erstellen Sie diese Datei im Projektverzeichnis und legen Sie mindestens einen Administrator an:

`users.json`

JSON

```code-container
[
  {
    "username": "admin",
    "password": "IhrSicheresPasswort"
  }
]

```

_(Hinweis: Der Benutzername im Frontend ist nicht relevant, aber das Passwort muss hier gesetzt werden.)_

## II. Variante 1: Lokaler Betrieb (Ohne Docker)

Diese Variante ist ideal für Entwicklung, Tests oder den direkten Betrieb auf einem Rechner mit installierter NodeJS-Umgebung.

### Voraussetzungen

*   **Node.js und npm** (Version 20 oder höher) muss auf Ihrem Computer installiert sein.
    

### Schritte zur Inbetriebnahme

1.  **Öffnen Sie die Kommandozeile (Terminal/Eingabeaufforderung)**.
    
2.  Navigieren Sie in das Hauptverzeichnis Ihres Mediathek-Projekts:
    
    Bash
    
    ```code-container
    cd /pfad/zu/ihrem/mediathek-projekt
    
    ```
    
3.  **Starten Sie den Server** über NodeJS:
    
    Bash
    
    ```code-container
    node server.js
    
    ```
    
4.  Der Server startet und gibt die Startmeldung aus:
    
    ```code-container
    🚀 SERVER läuft! http://localhost:3000
    
    ```
    
5.  **Öffnen Sie den Browser** und geben Sie die Adresse ein: `http://localhost:3000`
    

Der Server läuft nun im Vordergrund. Zum Beenden drücken Sie `Strg` + `C` (oder `Cmd` + `C`).

## III. Variante 2: Netzwerkserver / NAS (Mit Docker Compose)

Dies ist die empfohlene Lösung für den dauerhaften Betrieb auf einem Server oder NAS-System. Sie nutzt die von uns erstellten Dateien `Dockerfile` und `docker-compose.yml`.

### Voraussetzungen

*   **Docker** und **Docker Compose** müssen auf Ihrem Server (z.B. Linux-Server, Synology NAS, QNAP) installiert sein.
    
*   Ihr Projektordner muss auf den Server übertragen worden sein.
    

### Schritte zur Inbetriebnahme

#### 1\. Die `docker-compose.yml` finalisieren

Da wir Docker Compose nutzen, müssen wir **keine** Volumes manuell pflegen, aber die Pfadangaben müssen stimmen. Die aktuelle Datei ist bereits korrekt.

`docker-compose.yml` **(Ausschnitt der relevanten Volumes)**

YAML

```code-container
# ... (andere Konfiguration)
    volumes:
      # WICHTIGE Dateien (werden lokal im Projektordner des Servers gespeichert)
      - ./datenbank.js:/usr/src/app/datenbank.js
      - ./serien_datenbank.js:/usr/src/app/serien_datenbank.js
      - ./users.json:/usr/src/app/users.json
      # ... (alle anderen JSON/JS Dateien)
      
      # Wichtiger Ordner für hochgeladene Poster
      - ./uploads:/usr/src/app/uploads
      # ...

```

_(Dies stellt sicher, dass alle Daten (DB, UPLOADS, Konfig) persistent im lokalen Projektordner auf Ihrem Server gespeichert werden.)_

#### 2\. Build und Start

1.  **Öffnen Sie SSH** oder das Terminal auf Ihrem Netzwerkserver und navigieren Sie zum Projektordner:
    
    Bash
    
    ```code-container
    cd /pfad/auf/dem/server/zu/mediathek
    
    ```
    
2.  **Bauen Sie das Image und starten Sie den Container** im Hintergrund (`-d`):
    
    Bash
    
    ```code-container
    docker compose up -d --build
    
    ```
    
    _Der Befehl baut das Image einmalig (_`--build`_) und startet den Dienst persistent (_`-d`_)._
    
3.  **Status prüfen:**
    
    Bash
    
    ```code-container
    docker compose ps
    
    ```
    
    (Der Container sollte den Status `Up` anzeigen.)
    

#### 3\. Zugriff

Geben Sie im Browser die IP-Adresse Ihres Servers und den Port 3000 ein:

*   **Adresse:** `http://[IP_ADRESSE_IHRES_SERVERS]:3000`
    

Zum Stoppen der Anwendung auf dem Server verwenden Sie:

Bash

```code-container
docker compose down
```






