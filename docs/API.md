# 📡 API Documentation - Carrozzeria Motta

## Autenticazione

Tutte le API protette richiedono un token JWT valido nel cookie `auth-token`.

### POST /api/auth/login
Effettua il login dell'utente.

**Body:**
```json
{
  "email": "admin@carrozzeriamotta.it",
  "password": "admin123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "user_id",
    "email": "admin@carrozzeriamotta.it",
    "nome": "Admin",
    "cognome": "Carrozzeria Motta",
    "ruolo": "admin",
    "attivo": true
  },
  "message": "Login effettuato con successo"
}
```

### POST /api/auth/logout
Effettua il logout dell'utente.

**Response (200):**
```json
{
  "message": "Logout effettuato con successo"
}
```

### GET /api/auth/me
Restituisce i dati dell'utente corrente.

**Response (200):**
```json
{
  "user": {
    "id": "user_id",
    "email": "admin@carrozzeriamotta.it",
    "nome": "Admin",
    "cognome": "Carrozzeria Motta",
    "ruolo": "admin",
    "attivo": true
  }
}
```

## Clienti

### GET /api/clienti
Restituisce la lista dei clienti.

**Query Parameters:**
- `page` (optional): Numero pagina (default: 1)
- `limit` (optional): Elementi per pagina (default: 10)
- `search` (optional): Ricerca per nome/cognome/email

**Response (200):**
```json
{
  "clienti": [
    {
      "id": "client_id",
      "nome": "Mario",
      "cognome": "Rossi",
      "telefono": "+39 123 456 7890",
      "email": "mario.rossi@email.com",
      "indirizzo": "Via Roma 123",
      "citta": "Milano",
      "cap": "20100",
      "codiceFiscale": "RSSMRA80A01F205X",
      "partitaIva": null,
      "note": "Cliente affidabile",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "totalPages": 1
}
```

### POST /api/clienti
Crea un nuovo cliente.

**Body:**
```json
{
  "nome": "Mario",
  "cognome": "Rossi",
  "telefono": "+39 123 456 7890",
  "email": "mario.rossi@email.com",
  "indirizzo": "Via Roma 123",
  "citta": "Milano",
  "cap": "20100",
  "codiceFiscale": "RSSMRA80A01F205X",
  "partitaIva": null,
  "note": "Cliente affidabile"
}
```

### GET /api/clienti/[id]
Restituisce i dettagli di un cliente specifico.

### PUT /api/clienti/[id]
Aggiorna un cliente esistente.

### DELETE /api/clienti/[id]
Elimina un cliente.

## Veicoli

### GET /api/veicoli
Restituisce la lista dei veicoli.

**Query Parameters:**
- `clienteId` (optional): Filtra per cliente
- `page`, `limit`, `search`: Come per clienti

### POST /api/veicoli
Crea un nuovo veicolo.

**Body:**
```json
{
  "clienteId": "client_id",
  "marca": "Fiat",
  "modello": "Punto",
  "targa": "AB123CD",
  "anno": 2020,
  "colore": "Bianco",
  "numeroTelaio": "ZFA31200000123456",
  "cilindrata": "1200",
  "alimentazione": "benzina",
  "note": "Veicolo in buone condizioni"
}
```

## Ordini di Lavoro

### GET /api/ordini-lavoro
Restituisce la lista degli ordini di lavoro.

**Query Parameters:**
- `stato` (optional): Filtra per stato (in_attesa, in_corso, completato, consegnato)
- `clienteId` (optional): Filtra per cliente
- `assegnatoA` (optional): Filtra per dipendente assegnato
- `page`, `limit`: Paginazione

### POST /api/ordini-lavoro
Crea un nuovo ordine di lavoro.

**Body:**
```json
{
  "clienteId": "client_id",
  "veicoloId": "vehicle_id",
  "descrizione": "Riparazione paraurti anteriore",
  "stato": "in_attesa",
  "priorita": "media",
  "dataInizio": "2025-01-15T09:00:00.000Z",
  "dataFine": "2025-01-20T17:00:00.000Z",
  "assegnatoA": "employee_id",
  "costoStimato": 500.00,
  "note": "Controllare anche fari"
}
```

## Dashboard Stats

### GET /api/dashboard/stats
Restituisce le statistiche per la dashboard.

**Response (200):**
```json
{
  "ordiniTotali": 25,
  "ordiniInCorso": 8,
  "clientiTotali": 15,
  "fatturatoMese": 12500.00,
  "ordiniPerStato": {
    "in_attesa": 3,
    "in_corso": 8,
    "completato": 12,
    "consegnato": 2
  },
  "ordiniRecenti": [
    {
      "id": "order_id",
      "numeroOrdine": "ORD-2025-001",
      "cliente": {
        "nome": "Mario",
        "cognome": "Rossi"
      },
      "veicolo": {
        "marca": "Fiat",
        "modello": "Punto",
        "targa": "AB123CD"
      },
      "stato": "in_corso",
      "dataInizio": "2025-01-15T09:00:00.000Z"
    }
  ]
}
```

## Codici di Errore

- **400**: Bad Request - Dati non validi
- **401**: Unauthorized - Token mancante o non valido
- **403**: Forbidden - Permessi insufficienti
- **404**: Not Found - Risorsa non trovata
- **409**: Conflict - Conflitto (es. email già esistente)
- **500**: Internal Server Error - Errore del server

## Formato Errori

```json
{
  "error": "Messaggio di errore",
  "details": "Dettagli aggiuntivi (opzionale)"
}
```
