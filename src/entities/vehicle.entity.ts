import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Location } from './location.entity';
import { Contractor } from './contractor.entity';

@Entity('vehicles')
export class Vehicle {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column()
  plate_number: string;

  @Column()
  vehicle_type: string;

  @Column('timestamp')
  check_in_time: Date;

  @Column('timestamp', { nullable: true })
  check_out_time: Date;

  @Column('varchar', { length: 36 })
  location_id: string;

  @Column('varchar', { length: 36 })
  contractor_id: string;

  @Column({ nullable: true })
  mobile_number: string;

  @Column({ nullable: true })
  gate_in_id: string;

  @Column({ nullable: true })
  gate_out_id: string;

  @Column({ nullable: true })
  session_id: string;

  @Column('decimal', { nullable: true })
  payment_amount: number;

  @Column({ nullable: true })
  payment_status: string;

  @Column({ nullable: true })
  receipt_id: string;

  @Column({ nullable: true })
  created_by: string;

  @Column({ nullable: true })
  updated_by: string;

  @Column({ nullable: true })
  deleted_by: string;

  @Column({ type: 'timestamp', nullable: true })
  deleted_on: Date;

  @Column({ default: false })
  is_deleted: boolean;

  @CreateDateColumn({ name: 'created_on' })
  created_on: Date;

  @UpdateDateColumn({ name: 'updated_on' })
  updated_on: Date;

  @ManyToOne(() => Location, (location) => location.vehicles)
  @JoinColumn({ name: 'location_id' })
  parking_locations: Location;

  @ManyToOne(() => Contractor)
  @JoinColumn({ name: 'contractor_id' })
  contractors: Contractor;
}

