Here's the condensed API description for the Timer service:

---

### **Timer API**  
**Base URL:** `/api/timer`  
**Headers:**  
- `Authorization: Bearer <JWT>` (Required)  

#### **Endpoints:**

1. **Create Timer**  
   - **Method:** `POST`  
   - **Request Body:**  
     ```json
     {
       "timerType": "STOPWATCH|COUNTDOWN|POMODORO",
       "durationSeconds": 300,
       "taskIds": [1, 2],
       "title": "Work Session",
       "isBreak": false
     }
     ```  
   - **Response (201 Created):**  
     ```json
     {
       "id": 1,
       "userId": "string",
       "taskIds": [1, 2],
       "title": "string",
       "timerType": "string",
       "durationSeconds": 300,
       "remainingSeconds": 300,
       "startTime": "yyyy-MM-ddTHH:mm:ss",
       "isPaused": false,
       "isCompleted": false,
       "isBreak": false,
       "status": "RUNNING",
       "createdAt": "yyyy-MM-ddTHH:mm:ss"
     }
     ```  

2. **Get Active Timers**  
   - **Method:** `GET`  
   - **Path:** `/active`  
   - **Response:** List of active (non-completed) timers in same format as Create Timer.  

3. **Get Break Timers**  
   - **Method:** `GET`  
   - **Path:** `/breaks`  
   - **Response:** List of break timers (where `isBreak=true`).  

4. **Get Timer by ID**  
   - **Method:** `GET`  
   - **Path:** `/{id}`  
   - **Response:** Single timer in same format as Create Timer.  

5. **Get All User Timers**  
   - **Method:** `GET`  
   - **Response:** List of all user's timers.  

6. **Get Timers for Task**  
   - **Method:** `GET`  
   - **Path:** `/task/{taskId}`  
   - **Response:** List of timers associated with a task.  

7. **Pause Timer**  
   - **Method:** `PUT`  
   - **Path:** `/{id}/pause`  
   - **Response:** Updated timer with `isPaused=true` and `status="PAUSED"`.  

8. **Resume Timer**  
   - **Method:** `PUT`  
   - **Path:** `/{id}/resume`  
   - **Response:** Updated timer with `isPaused=false` and `status="RUNNING"`.  

9. **Stop Timer**  
   - **Method:** `PUT`  
   - **Path:** `/{id}/stop`  
   - **Response:** Updated timer with `isCompleted=true` and `status="COMPLETED"`.  

10. **Delete Timer**  
    - **Method:** `DELETE`  
    - **Path:** `/{id}`  
    - **Response:** `204 No Content`  

---

### **Notes:**  
- **Timer Types:**  
  - `STOPWATCH`: Counts up indefinitely  
  - `COUNTDOWN`: Counts down from `durationSeconds`  
  - `POMODORO`: Specialized work/break intervals  
- **Validation:**  
  - `durationSeconds` required for COUNTDOWN/POMODORO (must be positive)  
  - `timerType` is required  
- **Status Flow:**  
  ```
  RUNNING ↔ PAUSED → COMPLETED
  ```  
- All timestamps in ISO-8601 format (`yyyy-MM-ddTHH:mm:ss`).  

---

### **Example Requests:**  
1. **Create Pomodoro Timer:**  
   ```bash
   curl -X POST -H "Authorization: Bearer <JWT>" \
   -d '{"timerType":"POMODORO","durationSeconds":1500,"title":"Deep Work"}' \
   http://localhost:8080/api/timer
   ```  
2. **Pause Timer:**  
   ```bash
   curl -X PUT -H "Authorization: Bearer <JWT>" \
   http://localhost:8080/api/timer/123/pause
   ```  

--- 

This covers all timer operations with state management. Let me know if you'd like any modifications!