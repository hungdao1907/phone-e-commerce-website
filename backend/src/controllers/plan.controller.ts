import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { calendar, CALENDAR_ID } from '../config/google';

// Helper to convert date & time to ISO string
const parseDateTime = (dateStr: string, timeStr: string) => {
  // Simple parser: assuming date is "YYYY-MM-DD" and time is "HH:mm - HH:mm"
  try {
    const [start, end] = timeStr.split(' - ').map(t => t.trim());
    const startDate = new Date(`${dateStr}T${start}:00+07:00`);
    const endDate = end ? new Date(`${dateStr}T${end}:00+07:00`) : new Date(startDate.getTime() + 60 * 60 * 1000);
    return { start: startDate.toISOString(), end: endDate.toISOString() };
  } catch (e) {
    // Fallback if format doesn't match
    return {
      start: new Date().toISOString(),
      end: new Date(new Date().getTime() + 3600000).toISOString()
    };
  }
};

export const getPlans = async (req: Request, res: Response) => {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createPlan = async (req: Request, res: Response) => {
  try {
    const { title, date, time, location, participants } = req.body;
    const { start, end } = parseDateTime(date, time);

    // 1. Insert into Google Calendar
    let googleEventId = null;
    try {
      const event = await calendar.events.insert({
        calendarId: CALENDAR_ID,
        requestBody: {
          summary: title,
          location: location,
          description: `Participants: ${participants.join(', ')}`,
          start: { dateTime: start, timeZone: 'Asia/Ho_Chi_Minh' },
          end: { dateTime: end, timeZone: 'Asia/Ho_Chi_Minh' },
        },
      });
      googleEventId = event.data.id;
    } catch (gErr: any) {
      console.error('Google Calendar Error:', gErr?.response?.data || gErr);
      // We log the error but still save in our DB, or you can choose to fail the request
    }

    // 2. Save in PostgreSQL
    const plan = await prisma.plan.create({
      data: {
        title,
        date,
        time,
        location,
        participants,
        googleEventId,
      },
    });

    res.status(201).json(plan);
  } catch (error) {
    console.error('Error creating plan:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updatePlan = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { title, date, time, location, participants } = req.body;
    
    // Find existing plan
    const existingPlan = await prisma.plan.findUnique({ where: { id } });
    if (!existingPlan) return res.status(404).json({ error: 'Plan not found' });

    const { start, end } = parseDateTime(date, time);

    // 1. Update in Google Calendar
    if (existingPlan.googleEventId) {
      try {
        await calendar.events.update({
          calendarId: CALENDAR_ID,
          eventId: existingPlan.googleEventId,
          requestBody: {
            summary: title,
            location: location,
            description: `Participants: ${participants.join(', ')}`,
            start: { dateTime: start, timeZone: 'Asia/Ho_Chi_Minh' },
            end: { dateTime: end, timeZone: 'Asia/Ho_Chi_Minh' },
          },
        });
      } catch (gErr) {
        console.error('Google Calendar Update Error:', gErr);
      }
    }

    // 2. Update in PostgreSQL
    const plan = await prisma.plan.update({
      where: { id },
      data: { title, date, time, location, participants },
    });

    res.json(plan);
  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deletePlan = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    
    const existingPlan = await prisma.plan.findUnique({ where: { id } });
    if (!existingPlan) return res.status(404).json({ error: 'Plan not found' });

    // 1. Delete from Google Calendar
    if (existingPlan.googleEventId) {
      try {
        await calendar.events.delete({
          calendarId: CALENDAR_ID,
          eventId: existingPlan.googleEventId,
        });
      } catch (gErr) {
        console.error('Google Calendar Delete Error:', gErr);
      }
    }

    // 2. Delete from PostgreSQL
    await prisma.plan.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting plan:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
