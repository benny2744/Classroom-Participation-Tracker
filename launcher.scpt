-- Classroom Participation Tracker Launcher for Mac
-- This AppleScript provides a user-friendly dialog and launches the application

display dialog "🚀 Classroom Participation Tracker

This will start both the backend server and frontend app.

Features:
• Real-time sync across devices
• Fixed button responsiveness  
• Mobile-friendly interface
• Auto-save functionality

Ready to launch?" with title "Classroom Participation Tracker" buttons {"Cancel", "Start App"} default button "Start App" with icon note

if button returned of result is "Start App" then
    -- Get the directory of this script
    tell application "Finder"
        set scriptPath to container of (path to me) as string
        set posixPath to POSIX path of scriptPath
    end tell
    
    -- Launch Terminal and run the startup script
    tell application "Terminal"
        activate
        do script "cd '" & posixPath & "' && ./start-classroom-tracker.command"
    end tell
    
    -- Optional: Open browser after a short delay
    delay 5
    try
        open location "http://localhost:3000"
    end try
end if