import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Vehicle } from './vehicle.entity';
import { Location } from './location.entity';
import { Contractor } from './contractor.entity';
import { Attendant } from './attendant.entity';

@Entity('payments')
export class Payment {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 36 })
  vehicle_id: string;

  @Column('varchar', { length: 36 })
  location_id: string;

  @Column('varchar', { length: 36 })
  contractor_id: string;

  @Column('varchar', { length: 36, nullable: true })
  attendant_id: string;

  @Column('decimal')
  amount: number;

  @Column()
  payment_method: string;

  @Column()
  payment_status: string;

  @Column('decimal', { nullable: true })
  duration_hours: number;

  @Column('decimal', { nullable: true })
  hourly_rate: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @ManyToOne(() => Vehicle)
  @JoinColumn({ name: 'vehicle_id' })
  vehicles: Vehicle;

  @ManyToOne(() => Location)
  @JoinColumn({ name: 'location_id' })
  parking_locations: Location;

  @ManyToOne(() => Contractor)
  @JoinColumn({ name: 'contractor_id' })
  contractors: Contractor;

  @ManyToOne(() => Attendant)
  @JoinColumn({ name: 'attendant_id' })
  attendants: Attendant;
}

