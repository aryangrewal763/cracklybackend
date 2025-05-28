
import nodemailer from 'nodemailer';
require("dotenv").config();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { date, time, title, description } = req.body;
    
    // Get the logged-in user's email (this would depend on your auth system)
    // Example with Next.js and a session:
    // const session = await getSession({ req });
    // const userEmail = session?.user?.email;
    
    // For demo purposes, using a placeholder
    const userEmail = req.session?.user?.email || 'user@example.com';
    
    // Generate a Google Meet link (in a real app, you'd use Google Calendar API)
    // This is a placeholder format - real Google Meet links have a different format
    const meetingId = `meet-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const googleMeetLink = `https://meet.google.com/${meetingId}`;
    
    // Format date and time for email
    const meetingDate = new Date(`${date}T${time}`);
    const formattedDate = meetingDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = meetingDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Configure email transporter
    const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
          },
        });
    
    // Prepare email content
    const mailOptions = {
      from: "no-reply@gmail.com",
      to: userEmail,
      subject: `Meeting Scheduled: ${title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your Meeting Has Been Scheduled</h2>
          <p>Your meeting "${title}" has been scheduled for ${formattedDate} at ${formattedTime}.</p>
          
          ${description ? `<p><strong>Description:</strong> ${description}</p>` : ''}
          
          <p><strong>Google Meet Link:</strong> <a href="${googleMeetLink}" target="_blank">${googleMeetLink}</a></p>
          
          <p>You can add this meeting to your calendar using the link below:</p>
          <p><a href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${encodeURIComponent(meetingDate.toISOString().replace(/-|:|\.\d+/g, ''))}&details=${encodeURIComponent(description || '')}" target="_blank">Add to Google Calendar</a></p>
          
          <p>Thank you for using our meeting scheduler!</p>
        </div>
      `
    };
    
    // Send the email
    await transporter.sendMail(mailOptions);
    
    // Return success response
    return res.status(200).json({ 
      success: true, 
      message: 'Meeting scheduled successfully',
      meetLink: googleMeetLink 
    });
    
  } catch (error) {
    console.error('Error scheduling meeting:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to schedule meeting' 
    });
  }
}