import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db.js';
import Complaint from '@/models/Complaint.js';
import User from '@/models/User.js';
import TechnicianProfile from '@/models/TechnicianProfile.js';
import { authorizeApi, ROLES } from '@/lib/rbac.js';
import { createNotification } from '@/lib/notification-service.js';
import { logAudit } from '@/lib/audit.js';

export async function GET(req) {
  try {
    await dbConnect();
    const auth = await authorizeApi(req, [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SERVICE_MANAGER]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const targetZone = searchParams.get('zone') || '';

    const technicians = await User.find({ role: ROLES.TECHNICIAN, status: 'ACTIVE' }).select('name email phone');
    const profiles = await TechnicianProfile.find({});

    const profileMap = new Map();
    profiles.forEach((p) => profileMap.set(p.userId.toString(), p));

    const ranked = technicians.map((tech) => {
      const profile = profileMap.get(tech._id.toString()) || { zone: 'DEFAULT_ZONE', status: 'AVAILABLE', activeJobsCount: 0 };
      const sameZone = targetZone ? profile.zone.toLowerCase() === targetZone.toLowerCase() : false;

      let score = 0;
      if (sameZone) score += 50;
      if (profile.status === 'AVAILABLE') score += 30;
      score -= (profile.activeJobsCount || 0) * 10;

      return {
        techId: tech._id,
        name: tech.name,
        email: tech.email,
        phone: tech.phone,
        zone: profile.zone,
        status: profile.status,
        activeJobsCount: profile.activeJobsCount,
        score,
      };
    });

    ranked.sort((a, b) => b.score - a.score);

    return NextResponse.json({ success: true, technicians: ranked });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const auth = await authorizeApi(req, [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SERVICE_MANAGER]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { complaintId, technicianUserId } = await req.json();

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    const techUser = await User.findById(technicianUserId);
    if (!techUser || techUser.role !== ROLES.TECHNICIAN) {
      return NextResponse.json({ error: 'Invalid technician selected' }, { status: 400 });
    }

    complaint.assignedTechnician = techUser._id;
    complaint.status = 'TECHNICIAN_DISPATCHED';
    await complaint.save();

    await TechnicianProfile.findOneAndUpdate(
      { userId: techUser._id },
      { $inc: { activeJobsCount: 1 } }
    );

    await createNotification({
      userId: techUser._id,
      title: 'New Emergency Complaint Assigned',
      message: `You have been dispatched to complaint #${complaint.complaintId} (${complaint.priority} Priority).`,
      type: 'ALERT',
      link: `/technician/complaints`,
    });

    await logAudit({
      userId: auth.user.id,
      action: 'DISPATCH_TECHNICIAN',
      entity: 'Complaint',
      entityId: complaint._id.toString(),
      metadata: { technician: techUser.name },
    });

    return NextResponse.json({ success: true, complaint });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
