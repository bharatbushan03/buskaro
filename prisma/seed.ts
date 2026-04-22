/**
 * BusKaro Database Seed Script
 * 
 * Creates sample data for development:
 * - 1 Admin
 * - 2 Drivers  
 * - 3 Buses
 * - 10 Students
 * - 2 Routes with pickup points
 */

import { PrismaClient, UserRole, BusStatus, BusType, RouteStatus, PaymentStatus, AttendanceStatus, NotificationType, NotificationChannel } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clean existing data (optional - use with caution)
  await cleanDatabase();

  // Create Users & Profiles
  console.log('Creating users...');
  
  // 1. Admin
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@buskaro.com',
      passwordHash: await bcrypt.hash('admin123', SALT_ROUNDS),
      role: UserRole.ADMIN,
      status: 'ACTIVE',
      emailVerified: true,
      admin: {
        create: {
          name: 'System Administrator',
          department: 'Transport Department',
          permissions: ['MANAGE_USERS', 'MANAGE_BUSES', 'MANAGE_ROUTES', 'MANAGE_PAYMENTS', 'VIEW_ANALYTICS', 'MANAGE_NOTIFICATIONS', 'SYSTEM_SETTINGS']
        }
      }
    },
    include: { admin: true }
  });
  console.log(`✅ Admin created: ${adminUser.email}`);

  // 2. Routes (before buses and students)
  console.log('\nCreating routes...');
  
  const route1 = await prisma.route.create({
    data: {
      name: 'North Campus Route',
      routeNumber: 'NC-01',
      description: 'Covers north side of campus including hostels A, B, C',
      startLocation: 'Main Campus Gate',
      endLocation: 'North Residential Area',
      totalDistance: 8.5,
      estimatedDuration: 25,
      status: RouteStatus.ACTIVE,
      pathGeoJson: {
        type: 'LineString',
        coordinates: [
          [77.5946, 12.9716], // Main Gate
          [77.5950, 12.9720], // Library
          [77.5955, 12.9725], // Hostel A
          [77.5960, 12.9730], // Hostel B
          [77.5965, 12.9735], // Hostel C
        ]
      }
    }
  });
  console.log(`✅ Route created: ${route1.name}`);

  const route2 = await prisma.route.create({
    data: {
      name: 'South Campus Route',
      routeNumber: 'SC-01',
      description: 'Covers south side of campus including sports complex',
      startLocation: 'Main Campus Gate',
      endLocation: 'South Sports Complex',
      totalDistance: 6.2,
      estimatedDuration: 18,
      status: RouteStatus.ACTIVE,
      pathGeoJson: {
        type: 'LineString',
        coordinates: [
          [77.5946, 12.9716], // Main Gate
          [77.5940, 12.9710], // Admin Block
          [77.5935, 12.9705], // Sports Complex
        ]
      }
    }
  });
  console.log(`✅ Route created: ${route2.name}`);

  // 3. Pickup Points for routes
  console.log('\nCreating pickup points...');
  
  const pickupPoints1 = await prisma.pickupPoint.createMany({
    data: [
      {
        routeId: route1.id,
        name: 'Main Campus Gate',
        address: 'Main Entrance, University Road',
        latitude: 12.9716,
        longitude: 77.5946,
        sequenceOrder: 1,
        arrivalTime: '08:00',
        landmark: 'Near Security Booth'
      },
      {
        routeId: route1.id,
        name: 'Library Stop',
        address: 'Central Library',
        latitude: 12.9720,
        longitude: 77.5950,
        sequenceOrder: 2,
        arrivalTime: '08:05',
        landmark: 'Library Main Gate'
      },
      {
        routeId: route1.id,
        name: 'Hostel A Circle',
        address: 'Hostel A, Residential Block',
        latitude: 12.9725,
        longitude: 77.5955,
        sequenceOrder: 3,
        arrivalTime: '08:10',
        landmark: 'Hostel A Main Gate'
      }
    ]
  });
  console.log(`✅ Created ${pickupPoints1.count} pickup points for Route 1`);

  const pickupPoints2 = await prisma.pickupPoint.createMany({
    data: [
      {
        routeId: route2.id,
        name: 'Admin Block',
        address: 'Administrative Building',
        latitude: 12.9710,
        longitude: 77.5940,
        sequenceOrder: 1,
        arrivalTime: '08:15',
        landmark: 'Near Parking'
      },
      {
        routeId: route2.id,
        name: 'Sports Complex',
        address: 'South Sports Ground',
        latitude: 12.9705,
        longitude: 77.5935,
        sequenceOrder: 2,
        arrivalTime: '08:25',
        landmark: 'Main Stadium'
      }
    ]
  });
  console.log(`✅ Created ${pickupPoints2.count} pickup points for Route 2`);

  // 4. Buses
  console.log('\nCreating buses...');
  
  const buses = await Promise.all([
    prisma.bus.create({
      data: {
        registrationNumber: 'KA-01-AB-1234',
        model: 'Ashok Leyland Lynx',
        manufacturer: 'Ashok Leyland',
        year: 2022,
        type: BusType.STANDARD,
        capacity: 52,
        status: BusStatus.ACTIVE,
        currentRouteId: route1.id,
        fuelType: 'Diesel',
        insuranceExpiry: new Date('2025-12-31'),
        permitExpiry: new Date('2025-12-31')
      }
    }),
    prisma.bus.create({
      data: {
        registrationNumber: 'KA-01-CD-5678',
        model: 'Tata Starbus',
        manufacturer: 'Tata Motors',
        year: 2023,
        type: BusType.AC,
        capacity: 48,
        status: BusStatus.ACTIVE,
        currentRouteId: route2.id,
        fuelType: 'CNG',
        insuranceExpiry: new Date('2025-12-31'),
        permitExpiry: new Date('2025-12-31')
      }
    }),
    prisma.bus.create({
      data: {
        registrationNumber: 'KA-01-EF-9012',
        model: 'Volvo 8400',
        manufacturer: 'Volvo',
        year: 2021,
        type: BusType.LUXURY,
        capacity: 45,
        status: BusStatus.MAINTENANCE,
        fuelType: 'Diesel',
        insuranceExpiry: new Date('2025-06-30'),
        permitExpiry: new Date('2025-06-30')
      }
    })
  ]);
  console.log(`✅ Created ${buses.length} buses`);

  // 5. Drivers
  console.log('\nCreating drivers...');
  
  const drivers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'driver1@buskaro.com',
        passwordHash: await bcrypt.hash('driver123', SALT_ROUNDS),
        role: UserRole.DRIVER,
        status: 'ACTIVE',
        emailVerified: true,
        driver: {
          create: {
            name: 'Rajesh Kumar',
            licenseNumber: 'DL-KA-2019-45678',
            licenseExpiry: new Date('2027-03-15'),
            emergencyContact: '+91-9876543210',
            isOnDuty: true
          }
        }
      },
      include: { driver: true }
    }),
    prisma.user.create({
      data: {
        email: 'driver2@buskaro.com',
        passwordHash: await bcrypt.hash('driver123', SALT_ROUNDS),
        role: UserRole.DRIVER,
        status: 'ACTIVE',
        emailVerified: true,
        driver: {
          create: {
            name: 'Suresh Patel',
            licenseNumber: 'DL-KA-2020-78901',
            licenseExpiry: new Date('2028-06-20'),
            emergencyContact: '+91-9876543211',
            isOnDuty: true
          }
        }
      },
      include: { driver: true }
    })
  ]);
  console.log(`✅ Created ${drivers.length} drivers`);

  // Assign drivers to buses
  await prisma.bus.update({
    where: { id: buses[0].id },
    data: { currentDriverId: drivers[0].driver?.id }
  });
  await prisma.bus.update({
    where: { id: buses[1].id },
    data: { currentDriverId: drivers[1].driver?.id }
  });
  console.log('✅ Drivers assigned to buses');

  // 6. Students
  console.log('\nCreating students...');
  
  const studentData = [
    { name: 'Amit Sharma', email: 'amit@college.edu', dept: 'CSE', roll: 'CS2021001', bus: buses[0].id, route: route1.id },
    { name: 'Priya Patel', email: 'priya@college.edu', dept: 'ECE', roll: 'EC2021002', bus: buses[0].id, route: route1.id },
    { name: 'Rahul Gupta', email: 'rahul@college.edu', dept: 'ME', roll: 'ME2021003', bus: buses[0].id, route: route1.id },
    { name: 'Sneha Reddy', email: 'sneha@college.edu', dept: 'CSE', roll: 'CS2021004', bus: buses[0].id, route: route1.id },
    { name: 'Vikram Singh', email: 'vikram@college.edu', dept: 'EEE', roll: 'EE2021005', bus: buses[1].id, route: route2.id },
    { name: 'Neha Gupta', email: 'neha@college.edu', dept: 'CSE', roll: 'CS2021006', bus: buses[1].id, route: route2.id },
    { name: 'Arun Kumar', email: 'arun@college.edu', dept: 'ECE', roll: 'EC2021007', bus: buses[1].id, route: route2.id },
    { name: 'Divya Rao', email: 'divya@college.edu', dept: 'IT', roll: 'IT2021008', bus: buses[0].id, route: route1.id },
    { name: 'Karthik Nair', email: 'karthik@college.edu', dept: 'CSE', roll: 'CS2021009', bus: buses[0].id, route: route1.id },
    { name: 'Meera Iyer', email: 'meera@college.edu', dept: 'ECE', roll: 'EC2021010', bus: buses[1].id, route: route2.id },
  ];

  const students = await Promise.all(
    studentData.map(async (s, index) => {
      return prisma.user.create({
        data: {
          email: s.email,
          passwordHash: await bcrypt.hash('student123', SALT_ROUNDS),
          role: UserRole.STUDENT,
          status: 'ACTIVE',
          emailVerified: true,
          student: {
            create: {
              name: s.name,
              studentId: s.roll,
              department: s.dept,
              semester: 5,
              rollNumber: s.roll,
              busId: s.bus,
              routeId: s.route,
              address: 'College Campus Hostel',
              parentName: `Parent of ${s.name}`,
              parentPhone: `+91-9876543${100 + index}`
            }
          }
        },
        include: { student: true }
      });
    })
  );
  console.log(`✅ Created ${students.length} students`);

  // 7. Fee Structures
  console.log('\nCreating fee structures...');
  
  await Promise.all([
    prisma.busFeeStructure.create({
      data: {
        routeId: route1.id,
        amount: 15000,
        academicYear: '2024-25',
        semester: 1,
        description: 'North Campus Route - Full Semester',
        dueDate: new Date('2024-08-15'),
        lateFeePerDay: 50
      }
    }),
    prisma.busFeeStructure.create({
      data: {
        routeId: route2.id,
        amount: 12000,
        academicYear: '2024-25',
        semester: 1,
        description: 'South Campus Route - Full Semester',
        dueDate: new Date('2024-08-15'),
        lateFeePerDay: 50
      }
    })
  ]);
  console.log('✅ Created fee structures');

  // 8. Sample Payments
  console.log('\nCreating sample payments...');
  
  await Promise.all([
    prisma.payment.create({
      data: {
        studentId: students[0].student!.id,
        amount: 15000,
        status: PaymentStatus.COMPLETED,
        method: 'UPI',
        description: 'Bus fee - Semester 1',
        paidAt: new Date('2024-07-20'),
        receiptNumber: 'RCP-2024-0001'
      }
    }),
    prisma.payment.create({
      data: {
        studentId: students[1].student!.id,
        amount: 15000,
        status: PaymentStatus.PENDING,
        method: null,
        description: 'Bus fee - Semester 1'
      }
    })
  ]);
  console.log('✅ Created sample payments');

  // 9. Sample Attendance
  console.log('\nCreating sample attendance records...');
  
  const today = new Date();
  await Promise.all([
    prisma.attendance.create({
      data: {
        studentId: students[0].student!.id,
        busId: buses[0].id,
        routeId: route1.id,
        date: today,
        status: AttendanceStatus.PRESENT,
        boardingTime: new Date(today.setHours(8, 5, 0)),
        verifiedByPin: true,
        locationLat: 12.9720,
        locationLng: 77.5950
      }
    }),
    prisma.attendance.create({
      data: {
        studentId: students[1].student!.id,
        busId: buses[0].id,
        routeId: route1.id,
        date: today,
        status: AttendanceStatus.ABSENT
      }
    })
  ]);
  console.log('✅ Created sample attendance records');

  // 10. Sample Notifications
  console.log('\nCreating sample notifications...');
  
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: students[0].id,
        type: NotificationType.BUS_ARRIVING,
        title: 'Bus Arriving Soon',
        body: 'Your bus NC-01 will arrive at Library Stop in 5 minutes',
        channel: NotificationChannel.PUSH,
        status: 'SENT',
        sentAt: new Date()
      }
    }),
    prisma.notification.create({
      data: {
        userId: students[1].id,
        type: NotificationType.PAYMENT_DUE,
        title: 'Payment Reminder',
        body: 'Your bus fee payment of ₹15,000 is due on Aug 15, 2024',
        channel: NotificationChannel.EMAIL,
        status: 'SENT',
        sentAt: new Date()
      }
    })
  ]);
  console.log('✅ Created sample notifications');

  // 11. Sample Audit Logs (skip until Prisma client regenerated)
  console.log('\n⏭️  Skipping audit logs - regenerate Prisma client after migration');

  console.log('\n✨ Database seed completed successfully!');
  console.log('\nSample credentials:');
  console.log('  Admin:    admin@buskaro.com / admin123');
  console.log('  Driver 1: driver1@buskaro.com / driver123');
  console.log('  Driver 2: driver2@buskaro.com / driver123');
  console.log('  Student:  amit@college.edu / student123');
}

async function cleanDatabase() {
  // Delete in reverse order of dependencies
  // Note: AuditLog removed temporarily - regenerate Prisma client first
  await prisma.notification.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.busFeeStructure.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.pickupPin.deleteMany({});
  await prisma.pickupPoint.deleteMany({});
  await prisma.locationHistory.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.driver.deleteMany({});
  await prisma.admin.deleteMany({});
  await prisma.bus.deleteMany({});
  await prisma.route.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('🧹 Cleaned existing data\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
