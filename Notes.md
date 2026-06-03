INCOMING MESSAGE STRUCTURE 
Incoming webhook: {
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "2209771299853828",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15556517194",
              "phone_number_id": "1165465923317096"
            },
            "contacts": [
              {
                "profile": {
                  "name": "SUBHIN TM"
                },
                "wa_id": "917012838736",
                "user_id": "IN.1319920266149785"
              }
            ],
            "messages": [
              {
                "from": "917012838736",
                "from_user_id": "IN.1319920266149785",
                "id": "wamid.HBgMOTE3MDEyODM4NzM2FQIAEhggQUM5OEEyMzU2OTQ0NDdFMTYxMDM1NzU5RUZGQzAwQjYA",
                "timestamp": "1780477598",
                "text": {
                  "body": "This message is test"
                },
                "type": "text"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}



MESSAGE SENT CONFIRMATION

Incoming webhook: {
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "2209771299853828",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15556517194",
              "phone_number_id": "1165465923317096"
            },
            "contacts": [
              {
                "wa_id": "917012838736",
                "user_id": "IN.1319920266149785"
              }
            ],
            "statuses": [
              {
                "id": "wamid.HBgMOTE3MDEyODM4NzM2FQIAERgSQjFFMDJCMEEwQzc1Q0Y3ODQ3AA==",
                "status": "sent",
                "timestamp": "1780477246",
                "recipient_id": "917012838736",
                "recipient_user_id": "IN.1319920266149785",
                "pricing": {
                  "billable": false,
                  "pricing_model": "PMP",
                  "category": "utility",
                  "type": "free_customer_service"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}


MESSAGE SENT
Incoming webhook: {
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "2209771299853828",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15556517194",
              "phone_number_id": "1165465923317096"
            },
            "contacts": [
              {
                "wa_id": "917012838736",
                "user_id": "IN.1319920266149785"
              }
            ],
            "statuses": [
              {
                "id": "wamid.HBgMOTE3MDEyODM4NzM2FQIAERgSQjFFMDJCMEEwQzc1Q0Y3ODQ3AA==",
                "status": "delivered",
                "timestamp": "1780477248",
                "recipient_id": "917012838736",
                "recipient_user_id": "IN.1319920266149785",
                "pricing": {
                  "billable": false,
                  "pricing_model": "PMP",
                  "category": "utility",
                  "type": "free_customer_service"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}


READ STATUS
Incoming webhook: {
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "2209771299853828",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15556517194",
              "phone_number_id": "1165465923317096"
            },
            "contacts": [
              {
                "wa_id": "917012838736",
                "user_id": "IN.1319920266149785"
              }
            ],
            "statuses": [
              {
                "id": "wamid.HBgMOTE3MDEyODM4NzM2FQIAERgSQjFFMDJCMEEwQzc1Q0Y3ODQ3AA==",
                "status": "read",
                "timestamp": "1780477548",
                "recipient_id": "917012838736",
                "recipient_user_id": "IN.1319920266149785",
                "pricing": {
                  "billable": false,
                  "pricing_model": "PMP",
                  "category": "utility",
                  "type": "free_customer_service"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}