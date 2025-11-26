import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Profile } from './profile.entity';
import { Location } from './location.entity';

@Entity('attendants')
export class Attendant {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 36 })
  user_id: string;

  @Column('varchar', { length: 36, nullable: true })
  location_id: string;

  @Column({ nullable: true })
  status: string;

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

  @OneToOne(() => Profile)
  @JoinColumn({ name: 'user_id' })
  profiles: Profile;

  @ManyToOne(() => Location, (location) => location.attendants)
  @JoinColumn({ name: 'location_id' })
  parking_locations: Location;
}

